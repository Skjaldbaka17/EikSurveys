require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
const userDBName = "eikusers"
const surveysDB = "eiksurveys"

async function login(data){
    var message = {}
    var client = new Client({connectionString})
    await client.connect()

    try{
        var query = query = `update ${userDBName} set loggedin = loggedin+1, lastactivitydate = current_timestamp where email = '${data.email}' and password = '${data.password}' returning *`
        const result = await client.query(query)
        const {rows} = result
        if(!rows[0]){
            message.success = false
            message.error = "Lykilorð eða netfang er vitlaust"
        } else {
            message.success = true
            message.error = ""
            message.userID = rows[0].userid
        }
    }catch(error){
        message.success = false
        message.error = "Villa! Vefurinn liggur niðri. Prófaðu aftur síðar."
    }finally{
        await client.end()
        return message
    }
}

async function signUp(data){
    var message = await isEligibleForSignUp(data)
    if(message.success){

        var client = new Client({connectionString})
        await client.connect()

        try{
            var query = `Insert into ${userDBName}(email, password, invitationkey) values($1, $2, $3) returning userid`
            var values = [data.email, data.password, data.invitationKey]
            const result = await client.query(query, values)
            const { rows } = result
            if(!rows[0]){
                message.success = false
                message.error = "Villa! Tókst ekki að vista user í DB"
            } else {
                message.success = true
                message.error = ""
                message.userID = rows[0].userid
            }
        }catch(error){
            console.log(error)
            message.success = false
            message.error = "Villa! Kerfisvilla!"
        }finally{
            await client.end()
            return message
        }
    } else {
        return message
    }
}

async function logout(userID){
    var message = {}
    var client = new Client({connectionString})
    var query = query = `update ${userDBName} set loggedin = loggedin-1, 
    lastactivitydate = current_timestamp where userid = ${userID} returning *`

    try{
        const result = await client.query(query)
        const { rows } = result
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
        return message
    }
}

async function isEligibleForSignUp(data){
    var message = await isEmailTaken(data.email)
    if(message.success){
        message = await isInvitationKeyEligible(data.invitationKey)
        return message
    } else {
        return message
    }
}

async function isInvitationKeyEligible(invitationKey){
    var message = {}
    message.success = true
    message.error =""
    return message
}

async function isEmailTaken(email){
    var message = {}
    var client = new Client({connectionString})
    await client.connect()
    try{
        var query = `select * from ${userDBName} where email = '${email}'`
        const result = await client.query(query)
        const{ rows } = result
        if(rows[0]){
            message.success = false
            message.error = "Netfang tekið"
        } else {
            message.success = true
            message.error = ""
        }
    }catch(error){
        console.log(error)
        message.success = false
        message.error = "Villa! Tókst ekki að ná í upplýsingar um netföng."
    }finally{
        await client.end()
        return message
    }
}

async function feed(userID){
    var message = {}
    var userInfo = await getUserInfo(userID)
    if(!userInfo){
        message = await makeMessage(false, "No user with this id!", "Þú hefur ekki aðgang að þessum upplýsingum.")
    } else if(!userInfo.firstsurveytaken) {
        message.feed = await getFirstSurvey()
        message.success = message.feed && message.feed.length > 0 ? true:false
    } else {
        message.feed = await getSurveyFeed(userInfo)
        message.success = message.feed && message.feed.length > 0 ? true:false
    }
    return message
}

async function getFirstSurvey(){
    var client = new Client({connectionString})
    var query = `select * from ${surveysDB} where firstsurvey = true;`
    var feed = []
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(rows[0]){
            feed.push(rows[0])
        }
    }catch(error){
        console.log(error)
    }finally{
        await client.end()
        return feed
    }
}

async function getSurveyFeed(userInfo){
    var client = new Client({connectionString})
    var query = `select * from ${surveysDB} where currentamount < maxamount and firstsurvey = false and 
    not (${userInfo.userid} = any (takenby)) and
    minage <= ${userInfo.age} and maxage >= ${userInfo.age} and 
    ${userInfo.sex} = any (sex) and
    ${userInfo.socialposition} = any (socialposition) and 
    ${userInfo.location} = any (location);`
    var feed = []

    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        feed = rows
    }catch(error){
        console.log(error)
    }finally{
        await client.end()
        return await feed
    }
}

async function takeSurvey(userID, surveyID){
    var message = {}
    var client = new Client({connectionString})
    var query = `Update ${surveysDB} set viewedby = array_append(viewedby, ${userID}) where surveyid = ${surveyID}
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
            message.survey = rows[0]
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

async function getUserInfo(userID){
    var client = new Client({connectionString})
    var query = `Select * from ${userDBName} where userid = ${userID};`
    var userInfo = {}
    try{
        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        if(!rows[0]){
            userInfo = null
        } else {
            userInfo = rows[0]
        }
    }catch(error){
        console.log(error)
        userInfo = null
    }finally{
        await client.end()
        return userInfo
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

var database = {signUp, login, logout, feed, takeSurvey}

module.exports = database