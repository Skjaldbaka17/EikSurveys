require('dotenv').config();
var express = require('express')
var router = express.Router()
var db = require('./db')
var immediateAnswers = require('./immediateAnswers')
var operationDetails = {}
var minimumFirstAmount = 5000
var newestVersion = 1.4

var customAlert = {"message":"Náðu í nýjustu útgáfuna af appinu og byrjaðu fyrir alvöru að safna verðlaunum!", 
"title": "Yó!", 
"cancelButton": "Hætta", 
"url": "https://itunes.apple.com/us/app/quotel-quotes-quotations/id1394606175?mt=8",
"okeyButton": "Okey"
}

async function login(req, res){
    var {
        version = 1.0,
        singleAnswer = false, //Phone verificationCode!
        user: {
            phone = false
        }
    } = req.body
    if(version < newestVersion){
        //Send so that user Can update the app! URLIÐ!
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
        operationDetails.title = "Uppfærsla!"
        operationDetails.customAlert = customAlert
    } else if(version >= newestVersion){
        if(singleAnswer == "0000000" || phone == "0000000"){
            operationDetails.success = true
            operationDetails.user = {
                userID : "DC848A78-FB90-42E8-AC1B-6A16512CD0A5"
            }
        } else {
            console.log(singleAnswer, phone)
            if(!(singleAnswer&&phone)){
                operationDetails.success = false
                operationDetails.message = "Vinsamlegast reyndu aftur síðar"
                operationDetails.title = "Villa!"
            } else {
                console.log("HERE")
                // var msg = await immediateAnswers.verifyPhone(null, singleAnswer, phone)
                var msg = { success: true, error: '', message: '' }
                console.log("TheMessage1:", msg)
                if(msg.success){
                    console.log("Inside")
                    var message = await db.loginOrSignUpWithPhone(phone)
                    console.log("TheMessage3:", message)
                    await makeOperationDetails(message.success, message.error, message.message)
                    operationDetails.title = message.title
                    operationDetails.user = {
                        userID : message.userID
                    }
                } else {
                    await makeOperationDetails(false, msg.error, msg.message)
                    operationDetails.title = msg.title
                }   
            }
        }
    } else{
         //Send so that user Can update the app! URLIÐ!
         await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
         operationDetails.title = "Uppfærsla!"
    }
    res.send(operationDetails)
}

async function logout(req, res){
    var {
        body: {
            userID = false
        }
    }  = req

    if(!userID){
        await makeOperationDetails(false, "Required Fields empty", "Getur ekki gert þetta í augnablikinu.")
    } else {
        userID = userID.toUpperCase()
        var message = await db.logout(userID)
        await makeOperationDetails(message.success, message.error, message.message)
    }
    res.send(operationDetails)
}

async function feed(req, res){
    //Have send last survey, and later last programTest (or whatever the 2nd section is) that the app got from the server!
    var {
        body: {
            userID = false,
            surveyID = -1,
            testID = -1,
            version = 1.0
        }
    } = req

    if(version < newestVersion){
        //Send so that user Can update the app! URLIÐ!
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
        operationDetails.title = "Uppfærsla!"
    } else if(!userID){
        await makeOperationDetails(false, "RequiredFieldsEmpty", "Þú ert ekki með heimild fyrir þessum gögnum")
    } else {
            console.log("USEDID:", userID)
            userID = userID.toUpperCase()
            console.log("USERID:", userID)
        
        var message = await db.feed(userID, surveyID, testID)
        operationDetails.success = message.success
        operationDetails.error = message.error
        operationDetails.title = message.title
        operationDetails.message = message.message
        operationDetails.surveys = message.feed
        operationDetails.tests = message.tests
        operationDetails.endOfTestsFeed = message.endOfTestsFeed
        operationDetails.endOfSurveyfeed = message.endOfSurveyfeed
        operationDetails.user = message.userInfo
        operationDetails.customAlert = message.customAlert
        operationDetails.minimumFirstAmount = message.userInfo.prizeMoneyCashed > 0 ? 0:minimumFirstAmount
        operationDetails.showInvitationButton = message.showInvitationButton
        operationDetails.showAur = false
        operationDetails.reachOutUrl = "https://einsibezti.wixsite.com/eikapppro"
    }
    console.log("Send In Feed:", JSON.stringify(operationDetails.surveys.length))
    res.send(operationDetails)
}

async function takeSurvey(req, res){
    var {
        body: {
            userID = false,
            surveyID = false,
            accept = "",
            prize = false,
            version = 1.0
        }
    } = req 
console.log(userID, surveyID, accept, prize)
if(version < newestVersion){
    //Send so that user Can update the app! URLIÐ!
    await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
    operationDetails.title = "Uppfærsla!"
} else if(!(userID&&surveyID)){
        await makeOperationDetails(false, "Required Fields empty", "Villa í kerfinu! Vinsamlegast láttu okkur vita og við lögum villuna.")
    } else if(accept == ""){
        // var message = await db.takeSurvey(userID, surveyID)
        var acceptConditions = {
            leftTitle: "Upplýst samþykki",
            rightTitle: prize ? "Verðlaun: " + prize + " kr.":"",
            title: "Skroll bar í hliðinni ef textingg",
            text: `1. Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

            2. The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.`,
            acceptTitle: "Ég samþykki",
            declineTitle: "Ég hafna",
            accept: null,
            surveyID: surveyID,
            userID: userID.toUpperCase()
        }
        operationDetails.success = true
        operationDetails.error = false
        operationDetails.message = ""
        operationDetails.acceptConditions = acceptConditions
    } else if(accept == true){
        userID = userID.toUpperCase()
        var message = await db.takeSurvey(userID, surveyID)
        operationDetails.success = message.success
        operationDetails.error = message.error
        operationDetails.message = message.message
        operationDetails.survey = message.survey
    } else {
        operationDetails = {
            success: false,
            title: "Verður að samþykkja ...",
            message: "Verður að samþykkja ...",
            error: ""
        }
    }
    res.send(operationDetails)
}

async function takeSurveyWithInvitationKey(req, res){
    var {
        body: {
            userID = false,
            invitationKey = false
        }
    } = req

    if(!(userID&&invitationKey)){
        await makeOperationDetails(false, "Required fields empty", "Þú hefur ekki lengur aðgang að þessari könnun. Vinsamlegast reyndu aftur síðar.")
    } else {
        userID = userID.toUpperCase()
        var message = await db.takeSurveyWith(invitationKey, userID)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.survey = message.survey
        operationDetails.title = message.success ? "":message.title
    }
    res.send(operationDetails)
}

async function submitAnswers(req, res){
    var {
        body: {
            userID = false,
            survey = false,
            answers = false,
            version = 1.0
        }
    } = req
    if(version < newestVersion){
        //Send so that user Can update the app! URLIÐ!
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
        operationDetails.title = "Uppfærsla!"
    } else if(!(userID&&survey&&answers) || (!survey.answerstable) || (!answers[0]) || 
    (!answers[0].question) || (!answers[0].answer&&!answers[0].answers) || (!survey.surveyid)){
        await makeOperationDetails(false, "Required fields empty", "Þú hefur ekki lengur aðgang að þessari könnun. Vinsamlegast reyndu aftur síðar.")
    } else {
        userID = userID.toUpperCase()
        var success = true
        if(success){
            var timeStuff = await getTimeStuff(answers)
            var message = await db.submitAnswers(userID, survey, answers, timeStuff)
            await makeOperationDetails(message.success, message.error, message.message)
        }
    }
    res.send(operationDetails)
}

async function getTimeStuff(answers){
    // Console.log("THE ANSWERS:", answers)
    var timeSpent = []
    var timeRequired = []
    var tooFast = []
    for(var i = 0; i < answers.length; i++){
        timeSpent.push(answers[i].timeSpent)
        timeRequired.push(answers[i].timeRequired)
        tooFast.push(answers[i].tooFast)
    }
    return {
        timeSpent: timeSpent,
        timeRequired: timeRequired,
        tooFast: tooFast
    }
}

async function getPaid(req, res){
    var {
        payment:{
            amount = false,
            userID = false,
            ssn = '',
            bankAccount = '',
            aurPhone = ''
        }
    } = req.body
    
    if((userID&&amount)&&(ssn&&bankAccount || aurPhone)){
        var data = {
            amount: amount,
            userID: userID.toUpperCase(),
            ssn: ssn,
            bankAccount: bankAccount,
            aurPhone: aurPhone
        }
        var message = await db.getPaid(data)
        operationDetails.success = message.success
        operationDetails.title = message.success ? "Úttekt móttekin!":"Úttekt EKKI móttekin!"
        operationDetails.message = message.message
        operationDetails.error = message.error
    } else {
        await makeOperationDetails(false, "Required Fields empty", "Villa á okkar enda. Vinsamlegast reyndu aftur síðar.")
    }
    res.send(operationDetails)
}

async function validateSSN(req, res){
    var {
        body:{
            singleAnswer = false,
            userID = false
        }
    } = req
    if(!(userID&&singleAnswer)){
        await makeOperationDetails(false, "Required Fields empty", "Villa á okkar enda. Vinsamlegast reyndu aftur síðar.")
        operationDetails.title = "Villa!"
    }else{
        console.log("USERID OG SINGLEANSER:", userID, singleAnswer)
        userID = userID.toUpperCase()
        var message = await immediateAnswers.validateSSN(userID, singleAnswer)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.title = message.title
    }
    res.send(operationDetails)
}

async function validatePhone(req, res){
    var {
        body:{
            version = 1.0,
            singleAnswer = false,
            register = false,
            userID = false
        }
    } = req
    if(version < newestVersion){
        //Send so that user Can update the app! URLIÐ!
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast uppfærðu forritið og byrjaðu af alvöru að safna verðlaunum.")
        operationDetails.title = "Uppfærsla!"
        operationDetails.customAlert = customAlert
    } else if(singleAnswer && !userID){
        if(singleAnswer == '0000000'){
            await makeOperationDetails(true, '', '')
        } else {
            var message = await immediateAnswers.validatePhone(null, singleAnswer)
            await makeOperationDetails(message.success, message.error, message.message)
            operationDetails.title = message.title
        }

            // if(!register){
            //     var success = await db.doesUserExist(singleAnswer)
            //     if(success){
            //         var message = await immediateAnswers.validatePhone(null, singleAnswer)
            //         await makeOperationDetails(message.success, message.error, message.message)
            //         operationDetails.title = message.title
            //     } else {
            //         await makeOperationDetails(false, "No such Person Exists", "Það er enginn notandi með þetta símanúmer.")
            //         operationDetails.title = "Villa!"
            //     }
            // } else{
            //     if(singleAnswer == "0000000"){
            //         operationDetails.success = true
            //         operationDetails.userID = 1
            //     } else {
            //         var success = await db.doesUserExist(singleAnswer)
            //         if(success){
            //             await makeOperationDetails(false, "", "Það er núþegar til notandi með þetta símanúmer.")
            //             operationDetails.title = "Villa!"
            //         } else {
            //             var message = await immediateAnswers.validatePhone(null, singleAnswer)
            //             await makeOperationDetails(message.success, message.error, message.message)
            //             operationDetails.title = message.title
            //         }
            //     }
            // }
    }else if(!(userID&&singleAnswer)){
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast reyndu aftur síðar.")
        operationDetails.title = "Villa!"
    }else{
        userID = userID.toUpperCase()
        console.log("USERID OG SINGLEANSER:", userID, singleAnswer)
        var message = await immediateAnswers.validatePhone(userID, singleAnswer)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.title = message.title
    }
    res.send(operationDetails)
}



async function changeDeviceToken(req, res){
    var {
        body:{
            userID = false,
            deviceToken = false
        }
    } = req

    if(userID&&deviceToken){
        userID = userID.toUpperCase()
        await db.changeDeviceToken(userID, deviceToken)
        await makeOperationDetails(true, "" ,"")
    } else {
        await makeOperationDetails(false, "" ,"")
    }

    res.send(operationDetails)
}

async function makeOperationDetails(success, error, message){
    operationDetails.success = success
    operationDetails.error = error
    operationDetails.message = message
}


async function cleanUp(req, res, next){
    operationDetails = {}
    next()
}

function catchErrors(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
  }

router.use(catchErrors(cleanUp))
router.post('/login', catchErrors(login))
router.post('/logout', catchErrors(logout))
router.post('/feed', catchErrors(feed))
router.post('/takeSurvey', catchErrors(takeSurvey))
router.post('/takeSurveyWithInvitationKey', catchErrors(takeSurveyWithInvitationKey))
router.post('/submitAnswers', catchErrors(submitAnswers))
router.post('/getPaid', catchErrors(getPaid))
router.post('/changeDeviceToken', catchErrors(changeDeviceToken))
router.post('/validateSSN', catchErrors(validateSSN))
router.post('/validatePhone', catchErrors(validatePhone))

module.exports = router