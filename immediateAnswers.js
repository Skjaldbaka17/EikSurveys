require('dotenv').config()
const axios = require('axios'); // promised based requests - like fetch()
const { Client } = require('pg');
const sms = require('./sendSMS')

var phoneValidation = {}
const connectionString = process.env.DATABASE_URL;
const userDBName = process.env.USERDBNAME
var instance = axios.create({
  baseURL: 'https://api.ja.is/skra/v1/people',
  headers: {"Authorization": process.env.AUTH_SSN_KEY},
  timeout: 3000,
});

async function validateSSN(userID, ssn){
    var message = {}
    var ssnTaken = await checkIfSSNIsTaken(ssn, userID)
    if(ssnTaken){
        message = await makeMessage(false, "SSN already exists in our database!", "Það er núþegar til notandi skráður á þessa kennitölu." +
    " Ef þú kannast ekki við það að eiga þann aðgang hafðu samband við okkur og við skoðum málið.")
    message.title = "Kennitala frátekin"
        return message
    }

    try{
      var response = await instance.get(`/${ssn}`)
      if(response.status == 200){
          message = await makeMessage(true, "", "")
          saveSSNInfo(response.data, userID)
      } else {
          message = await makeMessage(false, response.status, "Kennitala fannst ekki. Vinsamlegast reyndu aftur.")
          message.title = "Villa!"
      }
    }catch(error){
        console.log(error)
      message = await makeMessage(false, "error", "")
      if(error.status = 404){
          message.title = "Kennitala ekki fundin"
          message.message = "Kennitala fannst ekki. Vinsamlegast reyndu aftur."
      } else {
          message.title = "Villa!"
          message.message = "Vinsamlegast reyndu aftur síðar."
      }
    }finally{
      return message
    }
  }

  async function saveSSNInfo(info, userID){
      console.log(info)
      var success = false
      var client = new Client({connectionString})
      var query = `update ${userDBName} set ssninfo = '${JSON.stringify(info)}' where userid = ${userID} returning *`
      console.log("SaveSSNINFO query: ", query)
      await client.connect()
      try{
        var result = await client.query(query)
        var { rows } = result
        if(rows[0]){
            success = true
        }
      }catch(error){
          console.log(error)
      }finally{
          await client.end()
          return success
      }
  }

    async function checkIfSSNIsTaken(ssn, userID){
        var exists = true
        var client = new Client({connectionString})
        var query = `select * from ${userDBName} where ssn = '${ssn}' and not userid = '${userID}'`
        await client.connect()
        console.log("Check if ssn is takne:", query)
        try{
            const result = await client.query(query)
            const { rows } = result
            if(!rows[0]){
                exists = false
            } else {
                console.log("Exists:", ssn, userID)
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

    async function makeMessage(success, error, message){
        var message = {
            success: success,
            error: error,
            message: message
        }
        return message
    }

    async function validatePhone(userID, phone){
        var message = {}
        var verifNumber = await getRandomInt(1000000)

        phoneValidation[`${userID}`] = verifNumber
        phoneValidation[`${phone}`] = verifNumber

        sms.sendSMS(phone,verifNumber,"Eik")
        message = await makeMessage(true, "", "")
        return message
    }

    async function saveVerificationNumber(userID, verificationNumber, phone){
        var client = new Client({connectionString})
        var query = `update ${userDBName} set phoneid = '${verificationNumber}' where phone = '${phone}' returning *`
        await client.connect()
        var success = false

        try{
            var result = await client.query(query)
            var { rows } = result
            if(rows[0]){
                success = true
            }
        }catch(error){
            console.log(error)
        }finally{
            await client.end()
            return success
        }
    }

    async function getRandomInt(max) {
        var num = `${Math.floor(Math.random() * Math.floor(max))}`;
        var mis = 6 - num.length
        for(var i = 0; i < mis;i++){
            num = `0${num}`
        }
        return num
      }

      async function verifyPhone(userID, verifPhone, phone){
          var message = {}
          if(phoneValidation[`${userID}`] == verifPhone){
              message = await makeMessage(true, "", "")
              delete phoneValidation[`${userID}`]
              delete phoneValidation[`${phone}`]
              console.log("Variable On Server!!!")
              return message
          } else if (phoneValidation[`${phone}`] == verifPhone){
            message = await makeMessage(true, "", "")
            delete phoneValidation[`${phone}`]
            console.log("Variable On Server!!!")
            return message
          } else {
              message = await makeMessage(false, "Too long waiting", "Þessi lykill er ekki lengur í notkun.")
              return message
          }
      }


module.exports = {validateSSN, validatePhone, verifyPhone}