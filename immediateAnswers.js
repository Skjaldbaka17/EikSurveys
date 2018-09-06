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

    instance.defaults.baseURL += `/${ssn}`
    try{
      var response = await instance.get()
      if(response.status == 200){
          message = await makeMessage(true, "", "")
          saveSSNInfo(response.data, userID)
      } else {
          message = await makeMessage(false, response.status, "Kennitala fannst ekki")
          message.title = "Villa!"
      }
    }catch(error){
        console.log(error)
      message = await makeMessage(false, "error", "")
      if(error.status = 404){
          message.title = "Kennitala ekki til"
          message.message = "Engin manneskja til með þessa kennitölu"
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
        var success = await saveVerificationNumber(userID, verifNumber)

        if(success){
            sms.sendSMS(phone,verifNumber,"Eik")
            message = await makeMessage(true, "", "")
        } else {
            delete phoneValidation[`${userID}`]
            message = await makeMessage(false, "Error", "Gat ekki sent þér skilaboð. Vinsamlegast reyndu aftur síðar.")
            message.title = villa
        }
        return message
    }

    async function saveVerificationNumber(userID, verificationNumber){
        var client = new Client({connectionString})
        var query = `update ${userDBName} set phoneid = '${verificationNumber}' where userid = ${userID} returning *`
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

      async function verifyPhone(userID, verifPhone){
          var message = {}
          if(phoneValidation[`${userID}`] == verifPhone){
              message = await makeMessage(true, "", "")
              delete phoneValidation[`${userID}`]
              console.log("Variable On Server!!!")
              return message
          }
          var client = new Client({connectionString})
          var query = `select * from ${userDBName} where userid = ${userID} and phoneid = '${verifPhone}'`
          await client.connect()
          try{
              var result = await client.query(query)
              var { rows } = result
              if(!rows[0]){
                  message = await makeMessage(false, "Error", "Rangur lykill. Lyklar eru bara nothæfir í skamma stund. Athugaðu hvort"+
                " þú gafst upp rétt símanúmer og reyndu aftur.")
                message.title = "Lykill passar ekki"
              } else {
                  message = await makeMessage(true, "", "")
              }
          }catch(error){
              console.log(error)
              message = await makeMessage(false, "Error", "Villa við að finna lykill. Vinsamlegast reyndu aftur síðar.")
              message.title = "Villa!"
          }finally{
              await client.end()
              return message
          }
      }


module.exports = {validateSSN, validatePhone, verifyPhone}