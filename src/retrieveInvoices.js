
/*******************************************
  GLOBALS
*********************************************/
const {
      log           ,
      errors        ,
      cozyClient    ,
      saveBills     ,
    }                  = require('cozy-konnector-libs'),
      Promise          = require('bluebird'           ),
      Readable         = require('stream'             ).Readable,
      $                = require('cheerio'            ),
      pdf2bill         = require('./pdf2bill'         ).pdf2bill



/***********************************************************************
  MAIN
************************************************************************/
var CTXT // the context sent by index.js
module.exports = (ctxt) => {
  CTXT = ctxt
  return retrieveInvoices()
}



/***********************************************************************
  INVOICES LIST RETRIEVAL
************************************************************************/

function retrieveInvoices() {
  return CTXT.requestFactory({jar:CTXT.cookieJar,cheerio:true, gzip:true})
  .get({
    url: 'https://serviceclients.lesechos.fr/customer/invoices/',
    headers: {
      Connection        : 'keep-alive',
      Host              : 'serviceclients.lesechos.fr',
      Accept            : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
      'cache-control'   : 'no-cache',
      'accept-encoding' : 'gzip, deflate',
      'Cache-Control'   : 'no-cache',
      'User-Agent'      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.108 Safari/537.36',
      'Upgrade-Insecure-Requests': '1',
    }
  })
  .then(body$ => {
    const invoices = []  // [{url:url, id:id}]
    body$('#main-content .invoice-download a').each((i,el)=>{
      const el$ = $(el)
      const url = el$.attr('href')
      const id  = url.match(/id\/(.*?)\//)[1]
      invoices.push({url, id})
    })
    log('info', 'invoices to get : n' + JSON.stringify(invoices));
    return Promise.mapSeries(invoices, invoice => {
      return getAndSaveInvoice(invoice)
      .catch( err => {
        log('error', 'could not getAndSaveInvoice invoice '+ invoice.url)  // TODO gestion correcte des erreurs ? throw new error ?
        log('error',  err.message)
      })
    })
  })
  .catch( err => {
    log('error', 'could not get invoice ')
    log('error', err.message)
    throw new Error(errors.VENDOR_DOWN) // TODO : on passe  à la suite ou on interrompt ?
  })
}



/***********************************************************************
  INVOICE : GET & SAVE
************************************************************************/

function getAndSaveInvoice(invoice) {
  const path = invoice.url.split('/')
  for (var i = 0; i < path.length; i++) {
    if (path[i]==='id') {
      invoice.id = path[i+1]
    }
  }
  return CTXT.requestFactory({jar:CTXT.cookieJar,cheerio:false,json:false,gzip:true})
  .get({
    url: invoice.url,
    encoding: null,
    headers : {
      Connection       : 'keep-alive',
      Host             : 'serviceclients.lesechos.fr',
      Accept           : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
      'cache-control'  : 'no-cache',
      'accept-encoding': 'gzip, deflate',
      'Cache-Control'  : 'no-cache',
      'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.108 Safari/537.36',
      'Upgrade-Insecure-Requests': '1',
    }
  })
  .then( body => {
    // console.log('====================');
    // console.log('after get invoice, body is a buffer, mais save'); TODO
    // console.log(body);
    return pdf2bill(body)
      .then( bill => {
        invoice = {...invoice, ...bill}
        // require('fs').writeFileSync('data/'+invoice.id+'.pdf', body)
        // TODO save pdf ( ou alors le télécharger 2 fois...)
        const fileDoc = cozyClient.files.create(bufferToStream(body), {  // TODO deduplicate if article already retrieved (à faire en amont non ?)
            name        : invoice.filename  ,
            dirID       : ''                , // TODO
            contentType : 'application/pdf' ,
          })
        return fileDoc
      })
  })
  .then(filedoc => {
    // save bill
    // TODO 1 sur le relevé bancaire le libelé est "PAIEMENT CB 1209 PARIS MES FINANCES FR CARTE 22773903"
    // et la date de l'opération est 2j après la date de facture : que mettre comme identifier ?
    // TODO 2 : comment est ce que je dis à savebills de ne pas à nouveau télécharger le pdf ?
    return saveBills([invoice], CTXT.fields, {identifiers: ['echos']}) // TODO : adapter au futur matching opéré par le service de la stack
  })
}


/********************************************
 * returns readableInstanceStream Readable
 *********************************************/
function bufferToStream(buffer) {
  const readableInstanceStream = new Readable({
    read() {
      this.push(buffer)
      this.push(null)
    }
  })
  return readableInstanceStream
}
