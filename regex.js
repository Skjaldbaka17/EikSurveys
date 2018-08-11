async function onlyLetters(string){
    return string.replace(/([^\w]|[ðþóæöáéúí_1234567890])/gi, '')
}

module.exports = {onlyLetters}