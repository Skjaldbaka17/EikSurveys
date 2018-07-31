require('dotenv').config();
const express = require('express')
const router = express.Router()
const db = require('./db')

var operationDetails = {}

async function signUp(req, res){
    const {
        body: {
            email = false,
            password = false,
            invitationKey = false
        }
    } = req

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
            operationDetails.id = message.id
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


async function cleanUp(req, res, next){
    operationDetails = {}
    next()
}

function catchErrors(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
  }

router.use(catchErrors(cleanUp))
router.post('/signUp', catchErrors(signUp))

module.exports = router