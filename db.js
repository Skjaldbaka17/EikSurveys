require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
const userDBName = "eikusers"

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


var database = {signUp}

module.exports = database