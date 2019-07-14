require('dotenv').config();
const { Client } = require('pg');
const { onlyLetters } = require('./regex')

const connectionString = process.env.DATABASE_URL;
const userDBName = process.env.USERDBNAME
const surveysDB = process.env.SURVEYSDB
const paymentDB = process.env.PAYMENTDB
const invitationKeysDB = process.env.INVITATIONKEYSDB

async function loginOrSignUpWithPhone(phone){
    var message = {}
    var client = new Client({connectionString})
    await client.connect()

    try{
    var query = `insert into ${userDBName} (phone, loggedin) values('${phone}', 1)  on conflict(phone) 
        do update set loggedin = 1, lastactivitydate = current_timestamp returning *`
        // var query = `update ${userDBName} set loggedin = loggedin+1, lastactivitydate = current_timestamp where phone = '${phone}' returning *`
        const result = await client.query(query)
        const {rows} = result
        if(!rows[0]){
            message.success = false
            message.message = "Gat ekki innskráð þig. Vinsamlegast reyndu aftur síðar."
        } else {
            message.success = true
            message.message = ""
            message.userID = rows[0].userid
        }
    }catch(error){
        console.log("ERRORLOGIN:", error)
        message.success = false
        message.message = "Villa! Vefurinn liggur niðri. Prófaðu aftur síðar."
    }finally{
        await client.end()
        return message
    }
}

async function logout(userID){
    var message = {}
    var client = new Client({connectionString})
    var query = `update ${userDBName} set loggedin = loggedin-1, lastactivitydate = current_timestamp, devicetoken = null where userid = '${userID}' returning *`

    try{
        console.log("Try8ing")
        await client.connect()
        const result = await client.query(query);
        console.log("Out of it")
        const { rows } = result
        console.log("HERE1")
        if(!rows[0]){
            message = await makeMessage(false, "No user with id: " + userID, "Getur ekki gert þetta í augnablikinu. Afsakið" 
        + " óþægindin.")
        } else {
            message = await makeMessage(true, "", "")
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, error, "Kerfisvilla! Vinsamlegast láttu okkur vita og við lögum hana við fyrsta tækifæri.")
    }finally{
        await client.end()
        console.log("End of logout!")
        return message
    }
}

async function feed(userID, surveyID, testID){
    var message = {}
    var userInfo = await getUserInfo(userID)
    if(!userInfo){
        message = await makeMessage(false, "No user with this id!", "Þú hefur ekki aðgang að þessum upplýsingum.")
    } 
    // else if(!userInfo.termsof){
    //     message = await makeMessage(false, "Not agreed to terms.", "Verður að samþykkja notendaskilmála til þess að geta tekið kannanir.")
    //     message.title = "Notendaskilmálar!"
    // }
    else if(!userInfo.firstsurveytaken) {
        message.feed = surveyID == -1 ? await getFirstSurvey():[]
        message.success = message.feed && (message.feed.length > 0) ? true:false
    } else {
        message.feed = await getSurveyFeed(userInfo, surveyID)
        if(message.feed.length > 0){
            message.endOfSurveyfeed = false
            message.endOfTestsFeed = false
            message.success = true}
        else {
            message.endOfSurveyfeed = true
            message.tests = await getTestsFeed(userInfo, testID)
            message.endOfTestsFeed = message.tests.count > 0 ? false:true
            message.success = true
        }
    }

    if(userInfo && userInfo.customalert){
        message.customAlert = userInfo.customalert
        await deleteCustomAlert(userID)
    }
    
    message.userInfo = userInfo
    message.showInvitationButton = false
    return message
}

async function deleteCustomAlert(userID){
    var client = new Client({connectionString})
    var query = `Update ${userDBName} set customalert = null where userid = '${userID}';`
    try{
        await client.connect()
        await client.query(query)
    }catch(error){
        console.log(error)
    }finally{
        await client.end()
        return
    }
}

async function getTestsFeed(userInfo, testID){
    return []
}

async function getFirstSurvey(){
    var client = new Client({connectionString})
    var query = `select * from ${surveysDB} where firstsurvey = true`
    var feed = []
    console.log("FirstSurveyQuery:", query)
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(rows[0]){
            rows[0].prize = "Verðlaun: " + rows[0].prize+"kr."
            feed.push(rows[0])
        }
    }catch(error){
        console.log(error)
    }finally{
        await client.end()
        return feed
    }
}

var sexes = ["Karl", "Kona"]
var socialposition = ["Grunnskóla", "Menntaskóla", "Háskóla", "Vinnumarkaði"]
async function getSurveyFeed(userInfo, surveyID){
    var indexSex = await sexes.indexOf(userInfo.sex)
    var indexSocialPos = await socialposition.indexOf(userInfo.socialposition)
    console.log("Indexes:", indexSex, indexSocialPos)
    var client = new Client({connectionString})
    var query = `select * from ${surveysDB} where surveyid > ${surveyID} and
    needinvitation = false and
    currentamount < maxamount and firstsurvey = false and 
    not ('${userInfo.userid}') = any (takenby) and
    minage <= ${userInfo.age} and maxage >= ${userInfo.age} and 
    '${indexSex >= 0 ? userInfo.sex:"Annað"}' = any (sex) and
    '${indexSocialPos >= 0 ? userInfo.socialposition:"Annað"}' = any (socialposition) and 
    '${userInfo.location}' = any (location)
    order by datecreated limit 10;`
    var feed = []
    console.log("GetSurveyFeed:", query)

    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        for(r in rows){
            rows[r].prize = "Verðlaun: " + rows[r].prize+"kr."
        }
        feed = rows
    }catch(error){
        console.log(error)
    }finally{
        await client.end()
        return await feed
    }
}

async function takeSurveyWith(invitationKey, userID){
    var userInfo = await getUserInfo(userID)
    var message = {}
    if(!userInfo || !userInfo.firstsurveytaken){
        message = await makeMessage(false, "", "Þú verður að klára fyrstu könnun fyrst.")
        message.title = "Fyrsta könnun fyrst!"
        return message
    } else {
        message = await isSurveyInvitationKeyEligible(invitationKey, userID)
    }
    if(message.success && message.surveyID){
        var message = await takeSurvey(userID, message.surveyID)
        return message
    } else {
        message.title = "Ekki til!"
        return message
    }
}

async function isSurveyInvitationKeyEligible(invitationKey, userID){
    var message = {}
    var client = new Client({connectionString})
    var query = `update ${invitationKeysDB} set usedby = array_append(usedby, '${userID}'), used = true 
    where invitationkey = '${invitationKey}' and used = false returning *`
    console.log("SurveyKeyEligibleQuery?", query)
    await client.connect()

    try{
        var result = await client.query(query)
        var { rows } = result
        if(!rows[0]){
            query = `select * from ${invitationKeysDB} where invitationkey = '${invitationKey}'`
            result = await client.query(query)
            rows = result.rows
            if(!rows[0]){
                message = await makeMessage(false, "No such invitationkey. for survey.", "Engin könnun í boði fyrir þennan boðslykil.")
            } else {
                message = await makeMessage(false, "No such invitationkey. for survey.", "Þessi boðslykill hefur þegar verið notaður.")
            }
        } else {
            message.success = true
            message.surveyID = rows[0].surveyid
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, "Error searching for inv.Key. Surveys.", "Kerfisvilla!. Vinsamlegast reyndu aftur síðar.")
    }finally{
        await client.end()
        return message
    }
}

async function takeSurvey(userID, surveyID){
    var message = {}
    var client = new Client({connectionString})
    var query = `Update ${surveysDB} set viewedby = array_append(viewedby, '${userID}') where surveyid = ${surveyID}
    returning *;`

    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            message = await makeMessage(false, "No survey with this ID", "Ekki er hægt að taka þessa könnun lengur. Takk fyrir"
        + " að sýna henni áhuga og afsakaðu óþægindin.")
        } else {
            message = await makeMessage(true, "", "Allt heppnaðist")
            var prize = rows[0].prize
            message.survey = rows[0]
            message.survey.prize = "Verðlaun: " + prize+"kr."
            if(message.survey.firstsurvey){
                message.survey.informationText = "Þú hefur klárað þína fyrstu könnun hjá Eik! Eik hefur því launað þér " + prize+
                "kr.! Verðlaunin hafa verið færð í stöðuna þína!"
            } else {
                message.survey.informationText = "Þú hefur klárað könnun hjá Eik!\n\nEik hefur lagt " +prize + " í sjóðinn þinn!"
            }
            
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, error, "Því miður liggur vefþjónninn niðri í einhvern tíma. Endilega reyndu"
    + " aftur síðar!")
    }finally{
        await client.end()
        return message
    }
}

async function submitAnswers(userID, survey, answers, timeStuff){
        var message = await saveAnswers(answers, survey, userID, timeStuff)
        if(message.success){
            console.log("HERE6")
            updateSurveyAndUser(userID, survey)
            console.log("HERE7")
            return message
        } else {
            console.log("HERE8")
            return message
        }
}

async function updateSurveyAndUser(userID, survey){
    var surveyInfo = await getSurveyInfo(survey.surveyid)
    if(!surveyInfo){return console.log("Could not get surveyInfo For:", userID, survey.surveyid)}
    var mess = await updateUser(userID, surveyInfo.prize, survey.surveyid, survey.firstsurvey)
    if(!mess.success){
        console.log("ShitVillaaaa!!!!")
    }
    mess = await updateSurvey(userID, survey.surveyid)
    if(!mess.success){
        console.log("SHIIIITTTVILLLANUMER222222")
    }
}

async function updateUser(userID, prizeMoneyEarned, surveyID, firstsurvey){
    //Keep prize money earned as an array???
    var message = {}
    var client = new Client({connectionString})
    var query = `Update ${userDBName} set ${firstsurvey ? "firstsurveytaken = true , ":""}
    prizemoneyearned = prizemoneyearned + ${prizeMoneyEarned}, 
    surveystaken = array_append(surveystaken, ${surveyID}) where userid = '${userID}' returning *`
    console.log("UpdateUser:", query)
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            message = await makeMessage(false, "Shit, updateUserFailed", "Fooookkk!")
        }else{
            message = await makeMessage(true, "", "")
        }
    }catch(error){
        console.log("UpdateUserError:", error)
        message = await makeMessage(false, error, "LAga!")
    }finally{
        await client.end()
        return message
    }
}

async function updateSurvey(userID, surveyID){
    var message = {}
    var client = new Client({connectionString})
    var query = `Update ${surveysDB} set takenby = array_append(takenby, '${userID}'),
    currentamount = currentamount+1 where surveyid = ${surveyID} returning *`
    console.log("UpdateSurvey:", query)
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            message = await makeMessage(false, "Error í updateSurvey", "Eitthvað vesen í gangi! Reyndu aftur síðar.")
        } else {
            message = await makeMessage(true, "", "")
        }
    }catch(error){
        console.log("UpdateSurveyError:", error)
        message = await makeMessage(false, error, "")
    }finally{
        await client.end()
        return message
    }
}

async function saveAnswers(answers, survey, userID, timeStuff){
    var message = {}
    console.log("HERE10")
    if(survey.firstsurvey){
        message = await saveFirstSurvey(answers, survey, userID)
        return message
    }
    
    var client = new Client({connectionString})
    var query = `Insert into ${survey.answerstable} (surveyid, userid, timerequired, timespent, toofast, `
    var values = [survey.surveyid, userID, timeStuff.timeRequired, timeStuff.timeSpent, timeStuff.tooFast]
    var value = "$1, $2, $3, $4, $5, "
    for(var i = 0; i < answers.length; i++){
        if(answers[i].multipleAnswers){
            values.push(answers[i].answers.filter((answer => answer)))
        } else { values.push(answers[i].answer)}
        query += answers[i].nameOfAnswerColumn
        value += `$${i+6}`
        if(i < answers.length-1){
            query += ","
            value += ","
        } else {
            query += ")"
        }
    }
    query += ` VALUES (${value}) returning *`
    console.log("AnswersTable:", query)

    try{
        await client.connect()
        const result = await client.query(query, values)
        const { rows } = result
        if(!rows[0]){
            message = await makeMessage(false, "Could not insert answers!", "Náði ekki að vista svörin þín. Reyndu aftur síðar.")
        } else {
            message = await makeMessage(true, "" ,"")
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, "Could not insert answers!", "Náði ekki að vista svörin þín. Reyndu aftur síðar."
    + " Ef það virkar ekki þá heldur hafðu samband við okkur og við skoðum orsökina.")
    }finally{
        await client.end()
        return message
    }
}

async function saveFirstSurvey(answers, survey, userID){
    var message = {}
    // var ssnTaken = await checkIfSSNExists(answers[1].answer, userID)
    // if(ssnTaken){
    //     message = await makeMessage(false, "SSN already exists in our database!", "Það er núþegar til notandi skráður á þessa kennitölu." +
    // " Ef þú kannast ekki við það að eiga þann aðgang hafðu samband við okkur og við skoðum málið.")
    //     return message
    // }
    var client = new Client({connectionString})
    var query = `Update ${userDBName} set name = '${answers[0].answer}',
    ssn = '${answers[1].answer}', age = ${await getAgeFromSSN(answers[1].answer)}, 
    location = '${await getLocationFrom(answers[4].answer)}', sex = '${answers[2].answer}', 
    socialposition = '${answers[3].answer}', address = '${answers[4].answer}'
    where userid = '${userID}' returning *`
    console.log(query)
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            message = await makeMessage(false, "No user with this ID. SaveFirstSurvey.", "Vinsamlegast loggaðu þig út. Náðu í nýja"
        + " uppfærslu af appinu og prófaðu aftur.")
        } else {
            message = await makeMessage(true, "", "")
            message.userInfo = rows[0]
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, error, "Kerfisvilla!")
    }finally{
        await client.end()
        return message
    }
}

async function getPaid(data){
    var message = {}
    // message = await hasWithdrawalInLine(data)
    // if(!message.success){
    //     return message
    // }
    var client = new Client({connectionString})
    var query = `insert into ${paymentDB}(money, aurnumber, bankaccount, ssn, userid) values($1, $2, $3, $4, $5) returning *`
    var values = [data.amount, data.aurPhone, data.bankAccount, data.ssn, data.userID]
    await client.connect()
    console.log("Get Paid Query:", query)
    try{
        const result = await client.query(query, values)
        const { rows } = result

        if(!rows[0]){
            message = await makeMessage(false, "Could not insert data into Payments!", "Mistök við að vista borgunarupplýsingar. Vinsamlegast"+
        " reyndu aftur síðar")
        } else {
            message = await makeMessage(true, "", "Úttekt getur tekið 1-2 virka daga að koma sér til skila.")
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, error, "Kerfisvilla! Vinsamlegast reyndu aftur síðar.")
    }finally{
        await client.end()
        return message
    }
}

async function hasWithdrawalInLine(data){
    var message = {}
    var client = new Client({connectionString})
    var query = `select * from ${paymentDB} where userid = '${data.userID}' and paid = false`
    console.log(query)
    await client.connect()
    try{
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            message.success = true
        } else {
            message = await makeMessage(false, "Error", "Við erum núþegar með úttekt eftir þig í biðröð. Þegar hún hefur verið afgreidd getur þú"+
        " gert aðra úttekt.")
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, "Error", "Villa")
    }finally{
        await client.end()
        return message
    }
}

async function checkIfSSNExists(ssn, userID){
    var exists = true
    var client = new Client({connectionString})
    var query = `select * from ${userDBName} where ssn = '${ssn}' and not userid = '${userID}'`
    await client.connect()
    try{
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            exists = false
        } else {
            exists = true
        }
    }catch(error){
        console.log(error)
        exists = true
    }finally{
        await client.end()
        return exists
    }
}

async function getLocationFrom(address){
    return 'Höfuðborgarsvæðið'
}

async function getAgeFromSSN(ssn){
        var day = parseInt(ssn/100000000)
        var dropped = (ssn%100000000)
        var month = parseInt(dropped/1000000)
        dropped = (dropped%1000000)
        var year = parseInt(dropped/10000)
        var checkNumber = parseInt((ssn%100)/10)
        var century = ssn%10
        if(century < 9){
            year += 2000 + century*100
        } else {
            year += 1000 + century*100
        }
        var date = new Date()
        var age = date.getFullYear() - year
        var birthDateThisYear = new Date(date.getFullYear() , month-1, day)
        if(date - birthDateThisYear < 0){
            age -= 1
        }
        return age
}

async function doesUserExist(phone){
    var client = new Client({connectionString})
    var query = `Select * from ${userDBName} where phone = '${phone}';`
    var success = false
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(rows[0]){
            success = true
        } 
    }catch(error){
        console.log(error)
        success = false
    }finally{
        await client.end()
        return success
    }
}

async function getSurveyInfo(surveyID){
    var client = new Client({connectionString})
    var query = `Select * from ${surveysDB} where surveyid = ${surveyID};`
    var survey = {}
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            survey = null
        } else {
            survey = rows[0]
        }
    }catch(error){
        console.log(error)
        survey = null
    }finally{
        await client.end()
        return survey
    }
}

async function getUserInfo(userID){
    var client = new Client({connectionString})
    var query = `Select * from ${userDBName} where userid = '${userID}';`
    var userInfo = {}
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            userInfo = null
        } else {
            userInfo = rows[0]
            userInfo.userid = userInfo.userid.toUpperCase()
            userInfo.surveysTaken = rows[0].surveystaken.length
            userInfo.prizeMoneyEarned = userInfo.prizemoneyearned 
            userInfo.prizeMoneyCashed = userInfo.prizemoneycashed 
            userInfo.prizeMoneyLeft = userInfo.prizemoneyearned - userInfo.prizemoneycashed 
            userInfo.myInformation = [
                {
                    text: "Kannanir teknar: ",
                    data: `${userInfo.surveysTaken}`
                },
                {
                    text: "Heildarupphæð safnað: ",
                    data: `${userInfo.prizeMoneyEarned} kr.`
                }
            ]
        }
    }catch(error){
        console.log(error)
        userInfo = null
    }finally{
        await client.end()
        return userInfo
    }
}


async function changeDeviceToken(userID, token){
    if(token){
        await cleanUpToken(token)
    }
    var client = new Client({connectionString})
    var query = `update ${userDBName} set devicetoken = '${token}' where userid = '${userID}'`

    try{
        await client.connect()
        await client.query(query)
    }catch(error){
        console.log(error, query)
    }finally{
        await client.end()
    }
}

async function cleanUpToken(deviceToken){
    var client = new Client({connectionString})
    var query = `update ${userDBName} set devicetoken = Null where devicetoken = '${deviceToken}'`
    await client.connect()

    try{
        await client.query(query)
    }catch(error){
        console.log(error)
    }finally{
        await client.end()
    }
}

async function makeMessage(success, error, message){
    var message = {
        success: success,
        error: error,
        message: message
    }
    return message
}

var database = {loginOrSignUpWithPhone, logout, feed, takeSurvey, submitAnswers, getPaid, takeSurveyWith, changeDeviceToken, getUserInfo, doesUserExist}

module.exports = database