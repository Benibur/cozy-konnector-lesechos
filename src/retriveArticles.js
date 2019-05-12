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
  return Promise.resolve(true)
  return retriveArticles()
}



/*******************************************
  BOOKMARKS RETRIEVAL
********************************************/
function retriveArticles() {
  return retrieveBookmarksList(1)
  .then( ()=>{
    log('info', 'all bookmarks list downloaded, there are ' + CTXT.bookmarksList.length + ' articles')
    return retrieveArticles()
  })
}

function retrieveBookmarksList(page) {
  console.log("totototot");
  return CTXT.requestFactory({jar:true,cheerio:false,json:true})
  .get({
    url : 'https://api.lesechos.fr/api/v1/auth/me/bookmarks',
    qs  : { page: page },
    headers: {
      Authorization  : CTXT.authorization,
      Origin         : 'https://www.lesechos.fr',
      Accept         : 'application/json, text/plain, */*',
      'cache-control': 'no-cache',
      'User-Agent'   : CTXT.USER_AGENT,
    }
  })
  .then(data => {
    CTXT.bookmarksList = CTXT.bookmarksList.concat(data.items)
    if (data.currentPage < data.totalPages) {
      return retrieveBookmarksList(page+1)
    }else {
      console.log('fin récursion');
      prepareBookmarksFileNames()
      return filterAlreadyDownladedArticles()
    }
  })
  .catch( error => {
    log('error', 'during bookmark list retrieval')
    log('error', error)
    throw new Error(errors.VENDOR_DOWN)
  })
}

function prepareBookmarksFileNames() {
  console.log('prepareBookmarksFileNames()');
  CTXT.bookmarksList.forEach( bookmark => {
    bookmark.filename = sanitizeFileName( moment(bookmark.publicationDate).format('YYYY-MM-DD') + ' - ' + bookmark.title) + '.html'
  })
}


/*******************************************
  ARTICLES RETRIEVAL
********************************************/
function retrieveArticles() {
  return Promise.map(CTXT.bookmarksList, bookmark=>{
    return isAlreadyDownloaded(bookmark)
    .then(bookmark => retrieveArticle(bookmark))  // TODO juste retrieveArticle ?
    .then(article  => saveArticle(article))
    .catch(error   => {
      if (error.message === 'fileAlreadyHere') {
        log('info', `useless to download https://www.lesechos.fr/x/x/-${bookmark.id}`)
      }else{
        log('error', 'while retrieving or saving article')
        log('error', error.message) // TODO throw an error ?
      }
    })
  }, {concurrency:5})
}

async function isAlreadyDownloaded(bookmark) {
  const oldBook = CTXT.history.find(b => b.lesechosId === bookmark.id)
  if (oldBook) {
    const fileDoc = await cozy.client.files.statById(oldBook._id) // check the already download still exists
    if (fileDoc) throw new Error('fileAlreadyHere')
  }
  return Promise.resolve(bookmark) // TODO return bookmark ?
}

function retrieveArticle(bookmark) {
  log('info', 'fetch article from ' + `https://www.lesechos.fr/x/x/-${bookmark.id}`)
  return CTXT.requestFactory({jar:CTXT.cookieJar,cheerio:true,json:false})
  .get({
    url    : `https://www.lesechos.fr/x/x/-${bookmark.id}`,
    jar    : CTXT.cookieJar,
    headers: {
      Accept                     : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
      'cache-control'            : 'no-cache',
      'User-Agent'               : CTXT.USER_AGENT,
      'Upgrade-Insecure-Requests': '1',
    }
  })
  .then(html$ => {
    let article = {
      rawHtml    : html$.html(),
      html$      : html$,
      filename   : bookmark.filename,
      url        : `https://www.lesechos.fr/x/x/-${bookmark.id}`,
      baseUrl    : 'https://www.lesechos.fr',
      lesechosId : bookmark.id,
    }
    return parseArticle(article)
  })
}

async function saveArticle(article) {
  const filename = article.filename
  // test existance of a file at this path (should not happen)
  const fileDoc = await cozyClient.files.statByPath(CTXT.fields.path + filename)
  if (fileDoc) throw new Error('fileAlreadyHere')
  // get dirID and save
  const dirDoc  = await cozyClient.files.statByPath(CTXT.fields.path) // todo : est on sûr que dirDoc existe ?
  const fileDoc = await cozyClient.files.create(article.inlinedHtml, {
    name        : filename    ,
    dirID       : dirDoc._id  ,  // TODO CTXT.fields.path   cozyClient.files.statByPath(path) ._id
    contentType : 'text/html' ,
  })
  log('info', 'save file ' + article.filename)
  return CTXT.history.add({
    lesechosId : article.lesechosId,
    cozyId     : fileDoc._id,
  })
}
