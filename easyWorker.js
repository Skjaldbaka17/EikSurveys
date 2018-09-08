var createSurvey = require('./createSurveysDb')



async function addTime(){
    var t = createSurvey.addTimeToAllSurveys()
    return t
}

module.exports = {addTime}