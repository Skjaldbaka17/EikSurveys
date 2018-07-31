require('dotenv').config();
const express = require('express')
const app = express()
const router = require('./router');

const accessKey = process.env.ACCESS_KEY

app.set('x-powered-by', false); //Security risk prevention.
app.set('port', (process.env.PORT || 5000));
app.use(express.urlencoded({ extended: true}));//Not necessary 'cause of multer upload.any!???
app.use(express.json()) //Check node_modules/body-parser/lib/types/json.js for limit fix of how large the file can be!Not necessary 'cause of multer upload.any!???
app.use(accessAuthorized)
app.use('/', router);

function accessAuthorized(req,res,next){
    const {key} = req.body
    if(key === accessKey) {
        next()
    } else{
      res.send({"success": false, "error": "You don't have the proper access rights for this data"})
    }
}


//Ef síðan er ekki til.
function notFoundHandler(req, res, next) { // eslint-disable-line
    console.log("Not Found")
    res.status(404);
    res.end("Error")
  }
  
  /*Ef upp kemur villa. Hinsvegar væri hægt að gera betur með því að 
    gefa upp meiri upplýsingar með status-kóðanum (default hér 500)*/
  function errorHandler(err, req, res, next) { // eslint-disable-line
    console.log("Error")
    res.status(500);
    res.end("Error")
  }

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
  });