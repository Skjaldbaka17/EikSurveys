const express = require('express')
const router = express.Router()
const database = require('./createSurveysDb')

var operationDetails = {}

async function home(req, res){
    res.render('home')
}

async function createSurvey(req, res){
    console.log(req.body)
    const {
        body:{
            password = false
        }
    } = req
    res.render('createSurvey')
    // if(!password || (password != "Skjaldbaka")){
    //     res.redirect('/eik')
    // } else{
    //     res.render('createSurvey')
    // }
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
    if(operationDetails.success){res.render('surveyCreated')}
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
module.exports = router