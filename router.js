require('dotenv').config();
const express = require('express')
const router = express.Router()
const db = require('./db')

var operationDetails = {}

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

    if(!(email&&password&&invitationKey)){
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

async function hashPassword(password){
    return password
}

async function feed(req, res){
    //Have send last survey, and later last programTest (or whatever the 2nd section is) that the app got from the server!
    const {
        body: {
            userID = false
        }
    } = req

    if(!userID){
        await makeOperationDetails(false, "RequiredFieldsEmpty", "Þú ert ekki með heimild fyrir þessum gögnum")
    } else {
        var message = await db.feed(userID)
        operationDetails.success = message.success
        operationDetails.error = message.error
        operationDetails.message = message.message
        operationDetails.feed = message.feed
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
router.post('/feed', catchErrors(feed))

module.exports = router