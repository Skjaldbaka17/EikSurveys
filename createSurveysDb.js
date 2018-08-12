require('dotenv').config();
const { Client } = require('pg');
const { onlyLetters } = require('./regex')
const pushNotifications = require('./pushNotifications')

const connectionString = process.env.DATABASE_URL;
const surveysDB = "eiksurveys"
const usersDB = "eikusers"
const surveysInvitationKeysDB = "surveyinvitationkeys"

async function createSurvey(data){
    var message = {}
    var randomInt = getRandomInt(0, 1000001)
    var answersTableName = await onlyLetters(data.name) + "_" + data.prize + "_" + randomInt
    var client = new Client({connectionString})
    var query = `insert into ${surveysDB} (name, prize, about, questions, maxamount, minamount, maxage, 
    minage, sex, socialposition, answerstable, location, numberofquestions, needinvitation) values($1, $2, $3, $4, $5, $6, $7, $8, 
        $9, $10, $11, $12, $13, $14) returning *`
    var values = [data.name , data.prize, data.about, JSON.stringify(data.questions), data.maxamount, data.minamount, data.maxage, data.minage,
    data.sex, data.socialposition, answersTableName, data.location, data.numberOfQuestions, data.needInvitation]
    console.log(query)

    var shouldCreateInvitationKeys = false
    var surveyID = false
    try{
        await client.connect()
        const result = await client.query(query, values)
        const { rows } = result
        if(!rows[0]){
            message = await makeMessage(false, "Villa!" , "Engu skilað í að inserta þessa könnun inn")
        } else {
            message = await createAnswersTable(data.questions, answersTableName)
            message.survey = rows[0]
            if(data.needInvitation){
                shouldCreateInvitationKeys = true
                surveyID = rows[0].surveyid
            }
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, error, "Villa í að búa til könnun. Kerfisvilla!")
    }finally{
        await client.end()
        console.log("ShouldNotify:", message.success, message.survey)
        if(shouldCreateInvitationKeys){
            await createInvitationKeys(data, surveyID)
        } else if (message.success && message.survey) {
                notifyUsersOfNewSurvey(message.survey)
        }
        return message
    }
}

async function notifyUsersOfNewSurvey(survey){
    console.log("Notifying")
    var deviceTokens = []
    var client = new Client({connectionString})
    var query = `select devicetoken from ${usersDB} where 
    devicetoken is not null and age >= ${survey.minage} and age <= ${survey.maxage} and
    sex = any ('{${survey.sex}}') and socialposition = any ('{${survey.socialposition}}') and
    location = any ('{${survey.location}}')`
    console.log("NotifyingQuery", query)
    await client.connect()
    try{
        const result = await client.query(query)
        const {rows} = result
        for(var i = 0; i < rows.length; i++){
            deviceTokens.push(rows[i].deviceToken)
        }
    }catch(error){
        console.log(error)
    }finally{
        await client.end()
        if(deviceTokens.length > 0){
            try{
                pushNotifications.newSurveyAvailable(deviceTokens)
            } catch(error){
                console.log("Villan:", error)
            }
        }
    }
}

async function createInvitationKeys(data, surveyID){
    var client = new Client({connectionString})
    console.log("Create MAN!")
    var query = `insert into ${surveysInvitationKeysDB}(surveyid, invitationkey)
        select ${surveyID} id, x from unnest(Array[${await generateUniqueInvitationKeys(data.amountOfInvitationKeys)}]) x`
        console.log(query)
    await client.connect()
    try{
        await client.query(query)
        console.log("Worked!")
    }catch(error){
        console.log("ERRRORR:::", error)
    }finally{
        await client.end()
        return
    }
}

async function generateUniqueInvitationKeys(amount){
    var keys = ""
    for(var i = 0; i < amount; i++){
        var key = (Math.random()*0xFFFFFF<<0).toString(16).toUpperCase()
        keys += `'${key}'`
        if(i < amount-1){
            keys += ","
        }
    }
    return keys
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

async function createAnswersTable(questions, name){
    var message = {}
    var client = new Client({connectionString})
    console.log("Questions:", questions)
    try{
        var query = `Create table ${name}(
            surveyid integer not null,
            userid integer not null,`

        for(var i = 0; i < questions.length; i++){
            query += ( await onlyLetters(questions[i].question)) + " varchar(255)" + (questions[i].multipleAnswers ? "[]":"")
            if(i < questions.length - 1){
                query += ","
            } else {query += " )"}
        }
        console.log("Query For answersTable: ", query)

        await client.connect()
        const result = await client.query(query)
        const { rows } = result
        console.log(rows)
        message = await makeMessage(true, "", "")

    }catch(error){
        console.log(error)
        message = await makeMessage(false, error, "Gat ekki búið til töflu fyrir svör. Kerfisvilla!")
    }finally{
        await client.end()
        return message
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


var database = {createSurvey}

module.exports = database