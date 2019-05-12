'use strict'

/******************************************************************************

  This is a Cozy connector in charge of retrieving the data from
  your https://lesechos.fr account

*******************************************************************************/

/*******************************************
  GLOBALS
*********************************************/
const {
      BaseKonnector ,
      requestFactory,
      log           ,
    }                  = require('cozy-konnector-libs'),
      authenticate     = require('./authentication'   ),
      retrieveInvoices = require('./retrieveInvoices' ),
      retriveArticles  = require('./retriveArticles'  )

var   CTXT          // connector contextual variables, inited later on
var   FOLDER_PATH   // retrieved in "fields"
var   FIELDS


/*******************************************
  COMMAND LINE PARAMETERS
  expected parameters
    --debug
*********************************************/
process.argv.forEach(function (val, index, array) {
  if (val === '--debug') {
    CTXT.DEBUG_MODE = true
  }
})


/*******************************************
  MAIN
*********************************************/
const baseKonnector = new BaseKonnector(start)

async function start(fields) {

  initCTXT(fields, this)

  log('info', 'Authenticating ...')
  // await authenticate(CTXT)
  log('info', 'Successfully logged in')

  log('info', 'Fetching the invoices ...')
  // await retrieveInvoices(CTXT)

  log('info', 'Fetching the articles')
  // await retriveArticles(CTXT)

}

module.exports = baseKonnector


/*******************************************
  INIT CTXT VARIABLES
*********************************************/
function initCTXT(fields, baseKonnector) {
  const req  =  requestFactory({cheerio:false,json:false})
  CTXT = {
            bookmarksList : []       , // retrieved bookmarks list
            baseKonnector : baseKonnector ,
            authorization : undefined, // retrieved during API authentication
            formKey       : undefined, // retrieved during account authentication
            cookieJar     : req.jar(), // the cookies for all the requests
            fields        : fields   , // fields retrieved from the user interface (login, pwd...)
            request       : req      ,
            DEBUG_MODE    : false    ,
            requestFactory: requestFactory ,
            history       : baseKonnector.getAccountData(),
            USER_AGENT    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.108 Safari/537.36',
            // add           : add
          }

  if(!CTXT.history) CTXT.history = []
  console.log("ACCOUNT DATA retrieved :", CTXT.history );
  console.log(typeof CTXT.history )
  console.log({a:1} )
  console.log(baseKonnector.getAccountData())


/*******************************************
  HISTORY OF DOWNLOADED ARTICLES MANAGEMENT
  CTXT.history.add(item)
  item = {
    cozyId     : string
    lesechosId : string
  }
*********************************************/
  CTXT.history.add = function (item) {
    this.push(item)
    baseKonnector.saveAccountData(CTXT.history.slice(), {merge:false}) // send a full array each time ?
  }
}





//
//
//
//     // e) save the bookmark in Cozy
//     // data structure : TODO : choose and implement :-)
//     // option 1 : a bookmark : you bookmark an online article that has a copy in your FS. This copy can be annoted and your bookmark reference both the copy and online versions.
//     // Option 2 : a "bookmark" is a note of a special type that contains an inlined copy of the html. Therefore as a note, it can be easyly augmented.
//     // ==> mon impression :
//     //  l'article doit être un "marbre", que l'on peut annoter et transformer en note.
//     //  Potentiellement ce "marbre" peut être ré importer (changement format vidéo, amélioration de l'import...)
//     //  reste le bookmark : une note d'un type particulier ou bien un objet en tant que tel ?
//   //   .then(fileDoc => {
//   //     const bookmark = {
//   //       title          : article.title             ,
//   //       articleDate    : article.date              ,
//   //       bookmarkedDate : article.dateBookmarked    ,
//   //       url            : article.url               ,
//   //       copyId         : fileDoc._id               ,
//   //       tags           : '         '               ,
//   //       note           : ''                        ,
//   //     }
//   //     cozyClient.data.create('bookmark', bookmark)
//   //   })
//   // }, {concurrency:ARTICLE_DOWNLOADS_CONCURRENCY})
//
//
//
// // /*****************************************
// //   RETRIEVE  ACCOUNT INFORMATION
// // ******************************************/
// // TODO when profile data is ready
// //   .then( () => {
// //     req = requestFactory({
// //       jar : true,
// //       json: false,
// //       cheerio: true
// //     })
// //     return req({
// //       uri: 'https://moncompte.lemonde.fr/customer/account/',
// //     })
// //
// //   }).then($ => {
// //     log('', $.html());
// //   })
//
//
//
// // /*****************************************
// //   RETRIEVE  PERSONAL INFORMATION
// // ******************************************/
// //
// //   .then( () => {
// //     req = requestFactory({
// //       jar : true,
// //       json: false,
// //       cheerio: true
// //     })
// //     return req({
// //       uri: 'https://moncompte.lemonde.fr/sales/order/history/',
// //     })
// //
// //   }).then($ => {
// //     console.log($.html());
// //   })
