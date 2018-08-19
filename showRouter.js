const express = require('express')
const router = express.Router()
const database = require('./createSurveysDb')
const { getUserInfo } = require('./db')
const {sendNotification} = require('./pushNotifications')
const sendCustomMessage = require('./customAlert')
const xss = require("xss");


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
    } else {
        res.render('createSurvey')
    }
}

async function customPushNot(req, res){
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
        console.log("IsItThere:",userInfo.devicetoken)
        if(userInfo && userInfo.devicetoken){
            sendNotification(userInfo.devicetoken, theMessage)
        }
        res.send("Completer!")
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

        var success = await sendCustomMessage(data)

        res.render('surveyCreated', {message: "Þetta heppnaðist" + success ? "":" ekki"})
    }
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
        const message = await database.createSurvey(data)
        await makeOperationDetails(message.success, message.error, message.message)
    }
    if(operationDetails.success){res.render('surveyCreated',{message:"Könnun hefur verið bætt í gagnasafnið"})}
    else {res.redirect('back')}
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
router.post('/createSurvey', catchErrors(createSurvey))
router.post('/createIT', catchErrors(createIT))
router.get('/surveyCreated', function(req, res){res.render('surveyCreated')})
router.post('/customPushNot', catchErrors(customPushNot))
router.post('/customMessage', catchErrors(customMessage))
module.exports = router