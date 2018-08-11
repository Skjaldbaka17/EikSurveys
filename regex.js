async function onlyLetters(string){
    var returnString = string.replace(/ð/gi, 'd')
    returnString = returnString.replace(/þ/gi, 'th')
    returnString = returnString.replace(/[óö]/gi, 'o')
    returnString = returnString.replace(/æ/gi, 'ae')
    returnString = returnString.replace(/á/gi, 'a')
    returnString = returnString.replace(/é/gi, 'a')
    returnString = returnString.replace(/ú/gi, 'u')
    returnString = returnString.replace(/í/gi, 'í')
    returnString = returnString.replace(/0/gi, 'null').replace(/1/gi, 'einn').replace(/2/gi, 'tveir')
    .replace(/3/gi, 'thrir').replace(/4/gi, 'fjorir').replace(/5/gi, 'fimm').replace(/6/gi, 'sex')
    .replace(/7/gi, 'sjo').replace(/8/gi, 'atta').replace(/9/gi, 'niu')
    returnString = returnString.replace(/([^\w]|_)/gi, '')
    return returnString
    // return string.replace(/([^\w]|[ðþóæöáéúí_1234567890])/gi, '')
}

module.exports = {onlyLetters}