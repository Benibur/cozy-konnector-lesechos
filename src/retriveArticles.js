/*******************************************
  GLOBALS
*********************************************/
const {
      log           ,
      errors        ,
      cozyClient    ,
    }                  = require('cozy-konnector-libs'),
      Promise          = require('bluebird'           ),
      sanitizeFileName = require('sanitize-filename'  ),
      moment           = require('moment'             ),
      parseArticle     = require('./article-parser'   )


var CTXT // the context sent by index.js
module.exports = (ctxt) => {
  CTXT = ctxt
  return retriveArticles()
}



/*******************************************
  BOOKMARKS RETRIEVAL
********************************************/
function retriveArticles() {
  return retrieveBookmarksList(1)
  .then( ()=>{
    console.log('all bookmarks list downloaded');
    console.log(CTXT.bookmarksList.length);
    return retrieveArticles()
  })
}

function retrieveBookmarksList(page) {
  let options = {
    url : 'https://api.lesechos.fr/api/v1/auth/me/bookmarks',
    qs  : { page: page },
    headers: {
      Authorization  : CTXT.authorization,
      Origin         : 'https://www.lesechos.fr',
      Accept         : 'application/json, text/plain, */*',
      'cache-control': 'no-cache',
      'User-Agent'   : CTXT.USER_AGENT,
    }
  }
  return CTXT.requestFactory({jar:true,cheerio:false,json:true})
  .get(options)
  .then(data => {
    CTXT.bookmarksList = CTXT.bookmarksList.concat(data.items)
    if (data.currentPage < data.totalPages) {
      return retrieveBookmarksList(page+1)
    }else {
      return true // TODO : or Promise.resolve(true) ?
    }
  })
  .catch( error => {
    log('error', 'during bookmark list retrieval')
    log('error', error)
    throw new Error(errors.VENDOR_DOWN)
  })
}


/*******************************************
  ARTICLES RETRIEVAL
********************************************/
function retrieveArticles() {
  return Promise.map(CTXT.bookmarksList, bookmark=>{
    return retriveArticle(bookmark)
    .then(article => saveArticle(article))
    .catch(error  => {log('error', 'while retrieving or saving article'); log('error', error.message)})
  }, {concurrency:5})

}

function retriveArticle(bookmark) {
  const options = {
    url    : `https://www.lesechos.fr/x/x/-${bookmark.id}`,
    jar    : CTXT.cookieJar,
    headers: {
      'cache-control'            : 'no-cache',
      'User-Agent'               : CTXT.USER_AGENT,
      'Upgrade-Insecure-Requests': '1',
      Accept                     : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
    }
  }
  log('info', 'fetch article from ' + `https://www.lesechos.fr/x/x/-${bookmark.id}`)
  return CTXT.requestFactory({jar:CTXT.cookieJar,cheerio:true,json:false})
  .get(options)
  .then(html$ => {
    let article = {
      rawHtml  : html$.html(),
      html$    : html$,
      filename : sanitizeFileName( moment(bookmark.publicationDate).format('YYYY-MM-DD') + ' - ' + bookmark.title),
      url      : `https://www.lesechos.fr/x/x/-${bookmark.id}`,
      baseUrl  : 'https://www.lesechos.fr',
    }
    return parseArticle(article)
  })
}

function saveArticle(article) {
  // TODO deduplicate if article already retrieved (à faire en amont non ?)
  const fileDoc = cozyClient.files.create(article.inlinedHtml, {
    name        : article.filename + '.html',
    dirID       : ''                        , // TODO
    contentType : 'text/html'               ,
  })
  log('info', 'save file ' + article.filename + '.html')
  return fileDoc
}
