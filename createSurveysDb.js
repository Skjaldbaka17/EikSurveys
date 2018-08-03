require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
const surveysDB = "eiksurveys"

async function createSurvey(data){
    var message = {}
    var randomInt = getRandomInt(0, 1000001)
    var answersTableName = await onlyLetters(data.name + "_" + data.price + "_" + randomInt)
    var client = new Client({connectionString})
    var query = `insert into ${surveysDB} (name, price, about, questions, maxamount, minamount, maxage, 
    minage, sex, socialposition, answerstable, location) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning *`
    var values = [data.name , data.price, data.about, JSON.stringify(data.questions), data.maxamount, data.minamount, data.maxage, data.minage,
    data.sex, data.socialposition, answersTableName, data.location]
    console.log(query)
    try{
        await client.connect()
        const result = await client.query(query, values)
        const { rows } = result
        if(!rows[0]){
            message = await makeMessage(false, "Villa!" , "Engu skilað í að inserta þessa könnun inn")
        } else {
            message = await createAnswersTable(data.questions, answersTableName)
        }
    }catch(error){
        console.log(error)
        message = await makeMessage(false, error, "Villa í að búa til könnun. Kerfisvilla!")
    }finally{
        await client.end()
        return message
    }
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
            query += ( await onlyLetters(questions[i].question)) + " varchar(255)"
            if(i < questions.length - 1){
                query += ","
            } else {query += " )"}
        }
        console.log(query)

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

async function onlyLetters(string){
    return string.replace(/[^\wðþóæöáéúí_]/gi, '')
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