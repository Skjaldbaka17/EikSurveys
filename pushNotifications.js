require('dotenv').config();
const apn = require('apn');
 
let options = {
  token: {
    // key: "AuthKey_DUWBVH8RU3.p8",
    // Replace keyID and teamID with the values you've previously saved.
    key: Buffer.from(process.env.AUTHKEY_APN, 'utf8'),
    keyId: process.env.KEY_ID,
   teamId: process.env.TEAM_ID
 },
 production: false //Change to true when Launch!
};

async function friendFinishedSurvey(deviceToken, name){
  console.log("The Options:", options)
  let apnProvider = new apn.Provider(options);
  // Prepare the notifications
  let notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
  notification.badge = 1;
  notification.sound = "ping.aiff";
  notification.alert = `Vinur þinn, ${name}, hefur klárað sína fyrstu könnun. Svo við ákváðum að verðlauna þér 500kr.!`;
  notification.payload = {'messageFrom': 'Eik'};
  console.log("Trying:", deviceToken)
  notification.topic = "YellowBus.Eik";
  // Replace deviceToken with your particular token:
  let deviceToken = deviceToken;
  // Send the actual notification
  apnProvider.send(notification, deviceToken).then( result => {
    // Show the result of the send operation:
    console.log(result);
  });
  await apnProvider.shutdown();
}

async function newSurveyAvailable(deviceTokens, nameOfSurvey, prizeForSurvey){
  console.log("The Options:", options)
  let apnProvider = new apn.Provider(options);
  // Prepare the notifications
  let notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
  notification.badge = 1;
  notification.sound = "ping.aiff";
  notification.alert = "Ný könnun í boði fyrir þig!";
  notification.payload = {'messageFrom': 'Eik'};
  console.log("Trying:", deviceTokens)

  // Replace this with your app bundle ID:
  notification.topic = "YellowBus.Eik";
  if(Array.isArray(deviceTokens)){
    for(var i = 0; i < deviceTokens.length; i++){
      // Replace deviceToken with your particular token:
      let deviceToken = deviceTokens[i];
      // Send the actual notification
      apnProvider.send(notification, deviceToken).then( result => {
        // Show the result of the send operation:
        console.log(result);
      });
    }
    } else {
      // Replace deviceToken with your particular token:
      let deviceToken = deviceTokens;
      // Send the actual notification
      apnProvider.send(notification, deviceToken).then( result => {
        // Show the result of the send operation:
        console.log(result);
      });
    }

  // Close the server
  await apnProvider.shutdown();
}

async function sendNotification(deviceTokens, message){
  console.log("The Options:", options)
  let apnProvider = new apn.Provider(options);
  // Prepare the notifications
  let notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
  notification.badge = 1;
  notification.sound = "ping.aiff";
  notification.alert = message;
  notification.payload = {'messageFrom': 'Eik'};
  console.log("Trying:", deviceTokens)
  notification.topic = "YellowBus.Eik";
  if(Array.isArray(deviceTokens)){
    for(var i = 0; i < deviceTokens.length; i++){
      // Replace deviceToken with your particular token:
      let deviceToken = deviceTokens[i];
      // Send the actual notification
      apnProvider.send(notification, deviceToken).then( result => {
        // Show the result of the send operation:
        console.log(result);
      });
    }
    } else {
      // Replace deviceToken with your particular token:
      let deviceToken = deviceTokens;
      // Send the actual notification
      apnProvider.send(notification, deviceToken).then( result => {
        // Show the result of the send operation:
        console.log(result);
      });
    }
  await apnProvider.shutdown();
}



module.exports = {newSurveyAvailable, friendFinishedSurvey, sendNotification}
