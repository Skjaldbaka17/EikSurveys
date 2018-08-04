async function onlyLetters(string){
    return string.replace(/[^\wðþóæöáéúí_]/gi, '')
}

module.exports = {onlyLetters}