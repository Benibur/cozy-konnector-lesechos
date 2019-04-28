/*******************************************
  GLOBALS
*********************************************/
const {
      log           ,
      errors        ,
    }                  = require('cozy-konnector-libs'),
      Promise          = require('bluebird'           )

var CTXT // the context sent by index.js
module.exports = (ctxt) => {
  CTXT = ctxt
  return authenticate(CTXT.fields.login, CTXT.fields.password)
}



/******************************************************
  AUTHENTIFICATION
  There are two authentications :
    1- one for the API & website
    2- one for the user account (invoices etc...)
********************************************************/
function authenticate(username, password) {
  return Promise.all([
    authenticateAPI    (username, password),
    authenticateAccount(username, password)
  ])
}


/******************************************************
  API AUTHENTIFICATION
  (api.lesechos.fr & lesechos.fr)
  also retrieves the cookie required for lesechos.fr
********************************************************/
function authenticateAPI(username, password) {
  var options = {
    jar     : CTXT.cookieJar,
    url     : 'https://api.lesechos.fr/api/v1/auth/login',
    body    : `{"email":"${username}","password":"${password}"}`,
    headers : {
      'User-Agent'   : CTXT.USER_AGENT,
      'cache-control': 'no-cache',
      'Content-Type' : 'application/json;charset=UTF-8',
      Origin         : 'https://www.lesechos.fr',
      Accept         : 'application/json, text/plain, */*'
    },
  }
  // return requestFactory({jar:true,cheerio:false,json:false}) // TODO : if json:true : error ???
  return CTXT.request // TODO : if json:true : error ???
    .post(options)
    .then(body=>{
      // console.log(JSON.parse(body))
      body = JSON.parse(body)
      CTXT.authorization = 'Bearer ' + body.token
      // store as cookies for lesechos.fr the data sent in the body
      body.cookies.forEach( coo => {
        CTXT.cookieJar.setCookie(CTXT.request.cookie(`${coo.name}=${coo.value}`), 'https://www.lesechos.fr')
      })
      CTXT.cookieJar.setCookie(CTXT.request.cookie(`authentication=${JSON.stringify(body)}`), 'https://www.lesechos.fr')
    })
    .then( ()=> log('info', 'API authentification OK'))
    .catch( err => {
      log('error', 'Server connection failed.')
      log('error',  err.message)
      // TODO tell the stack login is Nok, how can i know login failed ? err === 'id' ??
      throw new Error(errors.VENDOR_DOWN )
      throw new Error(errors.LOGIN_FAILED)
    })
}


/******************************************************
  ACCOUNT AUTHENTIFICATION
  (serviceclients.lesechos.fr)
  In two steps : get the form to retrieve the `form_key`
  and then submit the form
********************************************************/
function authenticateAccount(username, password) {
  // return CTXT.requestFactory({jar:CTXT.cookieJar,cheerio:true,json:false})
  return CTXT.requestFactory({jar:CTXT.cookieJar,cheerio:true,json:false}) // TODO is it possible to have `cheerio:true` in options ?
    .get({
      url     : 'https://serviceclients.lesechos.fr/customer/account/login/',
      gzip    : true,
      headers : {
        Connection        : 'keep-alive',
        Host              : 'serviceclients.lesechos.fr',
        Accept            : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
        'cache-control'   : 'no-cache',
        'accept-encoding' : 'gzip, deflate',
        'Cache-Control'   : 'no-cache',
        'User-Agent'      : CTXT.USER_AGENT,
        'Upgrade-Insecure-Requests': '1',
      }
    })
    .then( body$ => {
      CTXT.formKey = body$('#login-form input[name="form_key"]').attr('value')
    })
    .catch( err => {
      log('error', 'Server connection failed.')
      log('error', err)
      // TODO tell the stack login is Nok, how can i know login failed ? err === 'id' ??
      throw new Error(errors.VENDOR_DOWN)
      throw new Error(errors.LOGIN_FAILED)
    })
    .then( () => {
      return CTXT.requestFactory({jar:CTXT.cookieJar,cheerio:false,json:false, gzip:false})
        .post({
          url: 'https://serviceclients.lesechos.fr/customer/account/loginPost/',
          headers: {
            Origin           : 'https://serviceclients.lesechos.fr',
            Connection       : 'keep-alive',
            referer          : 'https://serviceclients.lesechos.fr/customer/account/',
            Accept           : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
            'cache-control'  : 'no-cache',
            'accept-encoding': 'gzip, deflate',
            'Postman-Token'  : 'f871a43f-409e-4d26-9052-0be074462e0f,c81b5286-d2f0-4e93-aa30-99d0b615f390',
            'Cache-Control'  : 'no-cache',
            'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.108 Safari/537.36',
            'Content-Type'   : 'application/x-www-form-urlencoded',
            'Upgrade-Insecure-Requests': '1',
          },
          form: {
            'form_key'       : CTXT.formKey,
            'login[username]': username    ,
            'login[password]': password    ,
          }
        })
        .then(body$=>{
          log('info', 'Account authentification OK')
        })
        .catch( err => {
          log('error', 'Account authentification failed.')
          log('error', err)
          // TODO tell the stack login is Nok, how can i know login failed ? err === 'id' ??
          throw new Error(errors.VENDOR_DOWN)
          throw new Error(errors.LOGIN_FAILED)
        })

    })
}
