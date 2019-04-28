'use strict'

const pdfParse   = require('pdf-parse'),
      moment     = require('moment'),
      amountReg  = /MONTANT NET TTC([\d,\.]*)\s€/,
      dateReg    = /Paris, le (\d{1,2}) ([éû\w]+) (\d{4})/


/*
  Return a promise in charge of returning a bill from the parsed pdf
*/
function pdf2bill(pdfBody) {
  return pdfParse(pdfBody, {max:1})
  .then(parsedPDF => text2bill(parsedPDF.text, pdfBody))
}


/*
  Generate a bill from the parsed pdf
*/
function text2bill(pdfTXT, pdfBody) {
  // console.log('pdfTXT :\n', pdfTXT);

  // 1- amount
  let
  amount = pdfTXT.match(amountReg)[1]
  amount = amount.replace(/,/,'.')
  amount = parseFloat(amount)

  // 2- date
  let date, day, month, year
  date = pdfTXT.match(dateReg)
  day   = date[1]
  month = date[2]
  year  = date[3]
  moment.locale('fr')
  month = month.replace(/fevrier/, 'février')
  month = month.replace(/aout/, 'août')
  month = month.replace(/decembre/, 'décembre')
  date  = moment(`${day}-${month}-${year}`, 'DD-MMMM-YYYY')

  // 3- filename
  let
  filename    = `${date.format('YYYY-MM-DD')} - LesEchos - facture - ` ,
  amountStr   = amount.toFixed(2) + '€'
  filename = filename + ' '.repeat(Math.max(0, 41 - filename.length - amountStr.length)) + amountStr + ' .pdf'

  // 4- the bill please :-)
  const
  bill = {
    type      : 'media'       ,
    vendor    : 'LesEchos'    ,
    date      : date.toDate() ,
    amount    : amount        ,
    currency  : 'EUR'         ,
    filename  : filename      ,
  }

  // console.log('in the end, the bill !', bill)

  return bill
}

module.exports = {pdf2bill, text2bill}
