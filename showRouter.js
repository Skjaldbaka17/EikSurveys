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
            location = false
        }
    } = req
    if(!(name&&about&&sex&&socialposition&&location&&questions&&(questions.length > 0))){
        console.log("Ekki nægar upplýsingar")
        await makeOperationDetails(false, "Error!", "Ekki nægar upplýsingar")
    } else {
        //Protext against sql-injections here! (xss, validate and sanitize!)
        for(var i = 0; i < questions.length; i++){
            questions[i].multipleAnswers = questions[i].multipleAnswers ? false:true
            questions[i].onlyNumbers = questions[i].onlyNumbers ? true:false
        }
        const data = {
            name: name,
            prize: prize,
            about: about,
            maxamount: maxamount,
            minamount: minamount,
            maxage: maxage,
            minage: minage,
            questions: questions,
            sex: sex,
            socialposition: socialposition,
            location: location,
            numberOfQuestions: questions.length
        }
        const message = await database.createSurvey(data)
        await makeOperationDetails(message.success, message.error, message.message)
    }
    if(operationDetails.success){res.send("Könnun hefur verið bætt í gagnasafnið!")}
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
module.exports = router