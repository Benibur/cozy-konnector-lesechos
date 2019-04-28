'use strict'
const path    = require('path')
// const pdf2bill = require('../src/index')
const text2bill = require(path.join(__dirname,'../src/pdf2bill')).text2bill
const moment    = require('moment')

/* ===================================================
  Tests for the regexp of pdf2bill.js
  To run tests : `node explo/pdf2bill.test.js`
====================================================== */

const pdfTXT =
`

ADRESSE DE LIVRAISON
TAUXTVAHORS TAXE
DESIGNATIONMONTANT TTC
4, rue de Mouchy 60438 Noailles Cedex
Facture acquittée N° FA210276807
Paris, le 21 fevrier 2016
FACEBOOK
M. MARK ZUCKERBERG
158 RUE MICHELET
92920 PLAGE


client 9/3433409
FACEBOOK
M. MARK ZUCKERBERG
158 RUE MICHELET
92920 PLAGE


Abonnement Les Echos Pack Numérique 1 an 192€
dont TVA 2,10 % : 3,95 €
192,00 €
MONTANT NET TTC192,02 €
2,10 %3,95 €188,05 €`


function test() {
  const bill = text2bill(pdfTXT)
  if(bill.amount !== 192.02){
    console.error('Wrong amoung parsing', bill.amount)

  } else if (bill.date !== moment('21/02/2016','DD/MM/YYYY').format()) {
    console.error('Wrong date parsing', bill.date)

  } else {
    console.log('** parsing is OK **')
  }
}


/* run tests  */
test()
