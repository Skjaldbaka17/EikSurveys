const axios = require('axios'); // promised based requests - like fetch()
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
const userDBName = process.env.USERDBNAME
var instance = axios.create({
  baseURL: 'https://api.ja.is/skra/v1/people',
  headers: {"Authorization": process.env.AUTH_SSN_KEY},
  timeout: 3000
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
      var query = `insert into ${userDBName} set ssninfo = ${JSON.stringify(info)} where userid = ${userID} returning *`
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


module.exports = {validateSSN}