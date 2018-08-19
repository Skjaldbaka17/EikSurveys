require('dotenv').config();
const { Client } = require('pg');
const connectionString = process.env.DATABASE_URL;
const usersDB = process.env.USERDBNAME

async function sendCustomMessage(data){
    var client = new Client({connectionString})
    var query = `update ${usersDB} set customalert ='{
        "message":"${data.message}",
        "title":"${data.title}"`
        if(data.cancelButton){
            query += `, "cancelButton":"${data.cancelButton}"`
        }
        if(data.url){
            query += `, "url":"${data.url}"`
        }
        if(data.okeyButton){
            query += `, "okeyButton":"${data.okeyButton}"`
        }
    query += `}'`
    if(!data.all && data.users){
        query += ` where userid = Any('{${data.users}}')`
    }
console.log("Custom Alert Query:", query)
    await client.connect()
    var success = false
    try{
        await client.query(query)
        success = true
    }catch(error){
        console.log(error)
        success = false
    }finally{
        await client.end()
        return success
    }
}

module.exports = sendCustomMessage