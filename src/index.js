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

const req  =  requestFactory({cheerio:false,json:false})

const CTXT = {  // pagecontextual parameters
          bookmarksList : []       , // retrieved bookmarks list
          authorization : undefined, // retrieved during API authentication
          formKey       : undefined, // retrieved during account authentication
          cookieJar     : req.jar(), // the cookies for all the requests
          fields        : undefined, // fields retrieved from the user interface (login, pwd...)
          request       : req      ,
          DEBUG_MODE    : false    ,
          requestFactory: requestFactory ,
          USER_AGENT    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.108 Safari/537.36'
        }

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
module.exports = new BaseKonnector(start)

async function start(fields) {

  CTXT.fields = fields

  log('info', 'Authenticating ...')
  // await authenticate(fields.login, fields.password)
  await authenticate(CTXT)
  log('info', 'Successfully logged in')

  log('info', 'Fetching the invoices')
  await retrieveInvoices(CTXT)

  // log('info', 'Fetching the articles')
  await retriveArticles(CTXT)

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
