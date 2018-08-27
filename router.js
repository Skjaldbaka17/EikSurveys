require('dotenv').config();
const express = require('express')
const router = express.Router()
const db = require('./db')

var operationDetails = {}
const minimumFirstAmount = 5000

async function login(req, res){
    const {
        user: {
            email = false,
            password = false,
        }
    } = req.body

    if(!(email&&password)){
        operationDetails.success = false
        operationDetails.message = `Verður að fylla inn í: ${email ? "": "netfang, "}${password ? "":"lykilorð, "}${invitationKey ? "":"boðslykil."}`
    }else{
        try {
            const data = {
                email: email,
                password: await hashPassword(password),
            }
            const message = await db.login(data)
            operationDetails.message = message.error
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
}

async function signUp(req, res){
    const {
        user: {
            email = false,
            password = false,
            invitationKey = false
        }
    } = req.body

    if(!(email&&password&&invitationKey) && !(myInvitationKey == "")){
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
            console.log("TheMessage:", message)
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
}

async function hashPassword(password){
    return password
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
            answers = false
        }
    } = req

    if(!(userID&&survey&&answers) || (!survey.answerstable) || (!answers[0]) || 
    (!answers[0].question) || (!answers[0].answer) || (!survey.surveyid)){
        console.log("The Thing:", (userID&&survey&&answers), (!survey.answerstable), (!answers[0]), (!answers[0].question), (!answers[0].answer),  (!survey.surveyid))
        await makeOperationDetails(false, "Required fields empty", "Þú hefur ekki lengur aðgang að þessari könnun. Vinsamlegast reyndu aftur síðar.")
    } else {
        console.log("HERE2")
        var message = await db.submitAnswers(userID, survey, answers)
        await makeOperationDetails(message.success, message.error, message.message)
        console.log("HERE3")
    }
    res.send(operationDetails)
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

module.exports = router