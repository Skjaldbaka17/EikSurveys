const express = require('express')
const router = express.Router()
const database = require('./createSurveysDb')
const { getUserInfo } = require('./db')
const {sendNotification} = require('./pushNotifications')
const sendCustomMessage = require('./customAlert')
const xss = require("xss");
var easyWorker = require('./easyWorker')
var sms = require('./sendSMS')


var operationDetails = {}

async function home(req, res){
    res.render('home')
}

async function createSurvey(req, res){
    console.log("What?", req.body)
    const {
        body:{
            password = false
        }
    } = req
    const thePassword = xss(password)
    if(!thePassword){
        res.redirect('/eik')
    } else if (thePassword == "CustomMessage"){
        res.render('customMessage')
    } else if (thePassword == "customPushNot"){
        res.render('customPushNot')
    } else if(thePassword == "addTime") {
        var t = await easyWorker.addTime()
        
        var themessage = "Náði að bæta við tíma!"
        if(!t){
            theMessage = "Náði ekki að bæta við tíma."
        }
        res.render('surveyCreated', {themessage})
    } else if(thePassword == "sendSMS"){
        res.render('customSMS')
    }
    else if(thePassword == "Einar"){
        res.render('createSurvey')
    } else if (thePassword == "addAnswersTable"){
        res.render('addAnswerTable')
    } else if(thePassword == "notifyUsersOfSurvey"){
        res.render('notifyUsersOfSurvey')
    }
    else {
        var themessage = "Ekki til"
        res.render('surveyCreated', {themessage})
    }
}

async function customSMS(req, res){
    const {
        body: {
            userID = false,
            message = false
        }
    } = req
    const theUserID = xss(userID)
    const theMessage = xss(message)
    if(!(theUserID&&theMessage)){
        res.redirect('/eik')
    } else {
        var userInfo = await getUserInfo(theUserID)
        if(userInfo){
            console.log("IsItThere:",userInfo.phone)
            var success = true
            if(userInfo && userInfo.phone){
                try{
                sms.sendSMS(userInfo.phone, message, "Eik")}
                catch(error){
                    success = false
                    console.log(error)
                }
            }
            var themessage = "Heppnaðist!"
            res.render('surveyCreated', {themessage})
        } else {
            res.send("Could Not MakeIT")
        }
    }
}

async function customPushNot(req, res){
    const {
        body: {
            userID = false,
            message = false
        }
    } = req
    console.log("Here")
    const theUserID = xss(userID)
    const theMessage = xss(message)
    if(!(theUserID&&theMessage)){
        res.redirect('/eik')
    } else {
        var userInfo = await getUserInfo(theUserID)
        if(userInfo){
            console.log("IsItThere:",userInfo.devicetoken)
            if(userInfo && userInfo.devicetoken){
                sendNotification(userInfo.devicetoken, theMessage)
            }
            var themessage = "Heppnaðist!"
            res.render('surveyCreated', {themessage})
        } else {
            res.send("Could Not MakeIT")
        }
    }
}

async function customMessage(req, res){
    const {
        body:{
            all = false,
            users = false,
            title = false,
            message = false,
            cancelButton = false,
            okeyButton = false,
            url = false
        }
    } = req
    console.log(req.body)
    if(!(all||users)||!(title&&message)){
        res.send("Required fields empty!")
    } else {
        var theUsers = Array.isArray(users) ? users:[users]
        const data = {
            all: xss(all),
            users: xss(theUsers),
            title: xss(title),
            message: xss(message),
            cancelButton: xss(cancelButton),
            okeyButton: xss(okeyButton),
            url: xss(url)
        }
        try{var success = await sendCustomMessage(data)
            var themessage = "Þetta heppnaðist"
            if(!success){themessage += " ekki"}
            res.render('surveyCreated', {themessage})
        }catch(error){console.log(error)}
    }
}

async function addAnswerTable(req, res){
    console.log("The Body:", req.body)
    const {
        body: {
            surveyID = false
        }
    } = req
    if(!surveyID){
        console.log("Ekki nægar upplýsingar")
        await makeOperationDetails(false, "Error!", "Ekki nægar upplýsingar")
    } else{
        message = await database.createAnswersTableFor(surveyID)
        await makeOperationDetails(message.success, message.error, message.message)
    }
    var themessage = operationDetails.message
    res.render('surveyCreated', {themessage})
}

async function notifyUsersOfSurvey(req, res){
    var message = {}
    const {
        body: {
            surveyID = false
        }
    } = req
    if(!surveyID){
        console.log("Ekki nægar upplýsingar")
        await makeOperationDetails(false, "Error!", "Ekki nægar upplýsingar")
    } else{
        message = await database.notifyUsersOfSurvey(surveyID)
        await makeOperationDetails(message.success, message.error, message.message)
    }
    console.log(message)
    var themessage = operationDetails.message
    res.render('surveyCreated', {themessage})
}

async function createIT(req, res){
    console.log("The Body:", req.body)
    const {
        body: {
            name = false,
            prize = false,
            about = false,
            maxamount = false,
            minamount = false,
            maxage = false,
            minage = false,
            sex = false,
            socialposition = false,
            questions = false,
            location = false,
            needInvitation = false,
            amountOfInvitationKeys = false
        }
    } = req
    if(!(name&&about&&sex&&socialposition&&location&&questions&&(questions.length > 0)) || (needInvitation&&!amountOfInvitationKeys)){
        console.log("Ekki nægar upplýsingar")
        await makeOperationDetails(false, "Error!", "Ekki nægar upplýsingar")
    } else {
        console.log("HERE1")
        //Protext against sql-injections here! (xss, validate and sanitize!)
        var theQuestions = Array.isArray(questions) ? questions:[questions]
        for(var i = 0; i < theQuestions.length; i++){
            theQuestions[i].multipleAnswers = theQuestions[i].multipleAnswers ? false:true
            theQuestions[i].onlyNumbers = theQuestions[i].onlyNumbers ? true:false
            if(!theQuestions[i].options) {
                theQuestions[i].multipleAnswers = false}
                else {
            theQuestions[i].options = Array.isArray(theQuestions[i].options) ? theQuestions[i].options:[theQuestions[i].options]}
        }
        console.log("HERE2")
        const data = {
            name: name,
            prize: prize,
            about: about,
            maxamount: maxamount,
            minamount: minamount,
            maxage: maxage,
            minage: minage < 15 ? 15:minage,
            questions: theQuestions,
            sex: Array.isArray(sex) ? sex: [sex],
            socialposition: Array.isArray(socialposition) ? socialposition:[socialposition],
            location: Array.isArray(location) ? location:[location],
            numberOfQuestions: questions.length,
            needInvitation: needInvitation ? true:false,
            amountOfInvitationKeys: amountOfInvitationKeys < 1000 ? amountOfInvitationKeys:1000
        }
        console.log("HERE3")
        try{
            const message = await database.createSurvey(data)
            await makeOperationDetails(message.success, message.error, message.message)
        } catch(error){
            console.log("Errror", error)
        }
    }
    var themessage = "Könnun hefur verið bætt í gagnasafnið"
    if(operationDetails.success){res.render('surveyCreated',{themessage})}
    else {res.redirect('back')}
}

async function privacyPolicy(req, res){
    console.log("Here")
    res.render('privacyPolicy')
    res.end()
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
router.get('/eik', catchErrors(home))
router.get('/eik/skilmalar', catchErrors(privacyPolicy))
router.post('/createSurvey', catchErrors(createSurvey))
router.post('/createIT', catchErrors(createIT))
router.get('/surveyCreated', function(req, res){res.render('surveyCreated')})
router.post('/customPushNot', catchErrors(customPushNot))
router.post('/customMessage', catchErrors(customMessage))
router.post('/customSMS', catchErrors(customSMS))
router.post('/addAnswerTable', catchErrors(addAnswerTable))
router.post('/notifyUsersOfSurvey', catchErrors(notifyUsersOfSurvey))
module.exports = router