require('dotenv').config();
const express = require('express')
const router = express.Router()
const db = require('./db')
const immediateAnswers = require('./immediateAnswers')
const bcrypt = require('bcrypt');
const saltRounds = 11;

var operationDetails = {}
const minimumFirstAmount = 5000

async function login(req, res){
    const {
        version = 1.0,
        singleAnswer = false,
        user: {
            email = false,
            password = false,
            phone = false
        }
    } = req.body
    if(version >= 1.2){
        console.log(singleAnswer, phone)
        if(!(singleAnswer&&phone)){
            operationDetails.success = false
            operationDetails.message = "Vinsamlegast reyndu aftur síðar"
            operationDetails.title = "Villa!"
        } else {
            
            var msg = await immediateAnswers.verifyPhone(null, singleAnswer, phone)
            console.log("TheMessage1:", msg)
            if(msg.success){
                console.log("Inside")
                var message = await db.loginWithPhone(phone)
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
    } else if(!(email&&password)){
        operationDetails.success = false
        operationDetails.message = `Verður að fylla inn í: ${email ? "": "netfang, "}${password ? "":"lykilorð, "}${invitationKey ? "":"boðslykil."}`
    }else{
        try {
            const data = {
                email: email,
                password: password,
            }
            console.log("2Mofo")
            const message = await db.login(data)
            operationDetails.message = message.message
            operationDetails.success = message.success
            operationDetails.title = message.title
            operationDetails.user = {
                userID : message.userID
            }
        } catch(error){
            console.log(error)
            operationDetails.success = false
            operationDetails.message = "Kerfisvilla!"
            operationDetails.title = "Villa!"
        }
    }
    res.send(operationDetails)
}

async function signUp(req, res){
    try{
    const {
        version = 1.0,
        singleAnswer = false,
        user: {
            phone = false,
            email = false,
            password = false,
            invitationKey = false
        }
    } = req.body

    if(version >= 1.2){
        if(!(singleAnswer&&phone&&invitationKey)){
            operationDetails.success = false
            operationDetails.message = "Vinsamlegast reyndu aftur síðar"
            operationDetails.title = "Villa!"
        } else {
            var msg = await immediateAnswers.verifyPhone(null, singleAnswer, phone)
            console.log("TheMessage1:", msg)
            if(msg.success){
                console.log("Inside")
                var message = await db.signUpWith(phone, invitationKey)
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
    } else if(!(email&&password&&invitationKey) && !(myInvitationKey == "")){
        operationDetails.success = false
        operationDetails.message = `Verður að fylla inn í: ${email ? "": "netfang, "}${password ? "":"lykilorð, "}${invitationKey ? "":"boðslykil."}`
    }else{
        try {
            const data = {
                email: email,
                password: await hashPassword(password),
                invitationKey: invitationKey
            }
            const message = await db.signUp(data)
            operationDetails.message = message.message
            operationDetails.success = message.success
            operationDetails.user = {
                userID : message.userID
            }
        } catch(error){
            console.log(error)
            operationDetails.success = false
            operationDetails.message = "Kerfisvilla!"
        }
    }
    res.send(operationDetails)
} catch(error){
    console.log(error)
}
}

async function hashPassword(password){
    return await bcrypt.hash(password, saltRounds)
}

async function logout(req, res){
    const {
        body: {
            userID = false
        }
    }  = req

    if(!userID){
        await makeOperationDetails(false, "Required Fields empty", "Getur ekki gert þetta í augnablikinu.")
    } else {
        var message = await db.logout(userID)
        await makeOperationDetails(message.success, message.error, message.message)
    }
    res.send(operationDetails)
}

async function feed(req, res){
    //Have send last survey, and later last programTest (or whatever the 2nd section is) that the app got from the server!
    const {
        body: {
            userID = false,
            surveyID = -1,
            testID = -1
        }
    } = req

    if(!userID){
        await makeOperationDetails(false, "RequiredFieldsEmpty", "Þú ert ekki með heimild fyrir þessum gögnum")
    } else {
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
    }
    res.send(operationDetails)
}

async function takeSurvey(req, res){
    const {
        body: {
            userID = false,
            surveyID = false
        }
    } = req 

    if(!(userID&&surveyID)){
        await makeOperationDetails(false, "Required Fields empty", "Villa í kerfinu! Vinsamlegast láttu okkur vita og við lögum villuna.")
    }else{
        var message = await db.takeSurvey(userID, surveyID)
        operationDetails.success = message.success
        operationDetails.error = message.error
        operationDetails.message = message.message
        operationDetails.survey = message.survey
    }
    res.send(operationDetails)
}

async function takeSurveyWithInvitationKey(req, res){
    const {
        body: {
            userID = false,
            invitationKey = false
        }
    } = req

    if(!(userID&&invitationKey)){
        await makeOperationDetails(false, "Required fields empty", "Þú hefur ekki lengur aðgang að þessari könnun. Vinsamlegast reyndu aftur síðar.")
    } else {
        var message = await db.takeSurveyWith(invitationKey, userID)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.survey = message.survey
        operationDetails.title = message.success ? "":message.title
    }
    res.send(operationDetails)
}

async function submitAnswers(req, res){
    const {
        body: {
            userID = false,
            survey = false,
            answers = false,
            version = 1.0
        }
    } = req
    if(!(userID&&survey&&answers) || (!survey.answerstable) || (!answers[0]) || 
    (!answers[0].question) || (!answers[0].answer&&!answers[0].answers) || (!survey.surveyid)){
        await makeOperationDetails(false, "Required fields empty", "Þú hefur ekki lengur aðgang að þessari könnun. Vinsamlegast reyndu aftur síðar.")
    } else {
        var success = true
        console.log("The answer:", version, survey.firstsurvey)
        if(version < 1.2 && survey.firstsurvey){
            var msg = await immediateAnswers.verifyPhone(userID, answers[answers.length-1].answer)
            success = msg.success
            await makeOperationDetails(false, msg.error, msg.message)
            operationDetails.title = msg.title
        }
        console.log("After The Thing")
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
    const {
        payment:{
            amount = false,
            userID = false,
            ssn = '',
            bankAccount = '',
            aurPhone = ''
        }
    } = req.body
    
    if((userID&&amount)&&(ssn&&bankAccount || aurPhone)){
        const data = {
            amount: amount,
            userID: userID,
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
    const {
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
        var message = await immediateAnswers.validateSSN(userID, singleAnswer)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.title = message.title
    }
    res.send(operationDetails)
}

async function validatePhone(req, res){
    const {
        body:{
            singleAnswer = false,
            invitationKey = false,
            userID = false
        }
    } = req
    if(singleAnswer && !userID){
            if(!invitationKey){
                var success = await db.doesUserExist(singleAnswer)
                if(success){
                    var message = await immediateAnswers.validatePhone(null, singleAnswer)
                    await makeOperationDetails(message.success, message.error, message.message)
                    operationDetails.title = message.title
                } else {
                    await makeOperationDetails(false, "No such Person Exists", "Það er enginn notandi með þetta símanúmer.")
                    operationDetails.title = "Villa!"
                }
            } else{
                var success = await db.doesUserExist(singleAnswer)
                if(success){
                    await makeOperationDetails(false, "", "Það er núþegar til notandi með þetta símanúmer.")
                    operationDetails.title = "Villa!"
                } else {
                    var message = await db.isInvitationKeyEligible(invitationKey)
                    if(!message.success){
                        await makeOperationDetails(false, message.error, message.message)
                        operationDetails.title = message.title
                    } else {
                        var message = await immediateAnswers.validatePhone(null, singleAnswer)
                        await makeOperationDetails(message.success, message.error, message.message)
                        operationDetails.title = message.title
                    }
                }
            }
    }else if(!(userID&&singleAnswer)){
        await makeOperationDetails(false, "Required Fields empty", "Vinsamlegast reyndu aftur síðar.")
        operationDetails.title = "Villa!"
    }else{
        console.log("USERID OG SINGLEANSER:", userID, singleAnswer)
        var message = await immediateAnswers.validatePhone(userID, singleAnswer)
        await makeOperationDetails(message.success, message.error, message.message)
        operationDetails.title = message.title
    }
    res.send(operationDetails)
}



async function changeDeviceToken(req, res){
    const {
        body:{
            userID = false,
            deviceToken = false
        }
    } = req

    if(userID&&deviceToken){
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
router.post('/signUp', catchErrors(signUp))
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