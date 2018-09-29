require('dotenv').config()
var request = require('request');  // npm install request


async function sendSMS(phone, message, sender){
    request.post({
        url: 'https://gatewayapi.com/rest/mtsms',
        oauth: {
          consumer_key: process.env.CONSUMER_KEY,
          consumer_secret: process.env.CONSUMER_SECRET,
        },
        json: true,
        body: {
          sender: sender,
          message: message,
          recipients: [{msisdn: phone}],
        },
      }, function (err, r, body) {
        console.log("Símadæmið: ", err ? err : body);
      });
}

module.exports = {sendSMS}

