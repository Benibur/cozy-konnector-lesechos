/*
  GLOBALS
 */
const path       = require('path')
const $          = require('cheerio')
const inline     = require('web-resource-inliner')
const Promise    = require('bluebird')
const inlineHtml = Promise.promisify(inline.html)
const resolve    = require("resolve-relative-url")


/****************************************************************************************
  MAIN :
  . expects article {html$, baseUrl, url}
    . html$   : the html Cheerio Object
    . baseUrl : a string containing the url to turn relative links into absolute urls
    . url : {string} absolute url to the article
  . return : a promise returning the article augmented with {inlinedHtml}
*****************************************************************************************/


module.exports = article => {

  //  1- remove some elements
  const SELECTORS_TO_REMOVE = [
    'script',
    'footer > :nth-child(2)',
    'footer > :nth-child(2)'
  ]
  const art$ = article.html$('html')
  SELECTORS_TO_REMOVE.forEach(sel => art$.find(sel).remove())

  //  2- remove top header with stocks
  art$.find('a[href="https://investir.lesechos.fr/"]').parent().remove()

  // 3- add lazy loaded images
  noscriptImg = art$.find('.lazyload-placeholder ~ noscript')
  noscriptImg.each((i,noscriptEl)=>{
    let noscript$ = $(noscriptEl)
    noscript$.parent().append(noscript$.text())
    noscript$.remove()
  })

  // 4- adapt article header
  let header$ = $(art$.find('#app > header'))
  let innerHTML = `<svg role="img" style="max-width: 160px; padding-left: 15px; padding-right: 15px;" viewBox="0 0 211.5 40"><path d="M12.7 8.4v24.9c0 2.3.7 3.5 3.7 3.5H20c4.1 0 6-1.6 7.4-4.6l1.3-2.9 2.1.6-1.6 9.5H0v-2.1C5.2 36.2 5.4 36 5.4 34V8.3c0-2.1-.3-2.2-5.4-3.2V3h18.3v2.1c-5.3 1-5.6 1.1-5.6 3.3zm41 11c0 3.4-1.9 7.2-14.6 7.8.3 5.2 3 8.6 7.4 8.6 2.4 0 4.7-1 6.7-2.9l1.2 1.4c-2.3 3.4-6.1 5.8-10.5 5.8-7.1 0-12.2-5.1-12.2-13 0-7.7 6.2-13.8 13.5-13.8 6.1-.2 8.5 3.5 8.5 6.1zm-8.8-4.1c-4 0-5.7 4.3-5.9 9.7 8.7-1.3 9-4.6 9-6.5.1-2.2-1.7-3.2-3.1-3.2zM64.6 40c-6.3 0-8.7-2.5-8.7-5.2 0-2 2-3.8 4.6-3.3l.7.8c-1.6 2.8-.4 5.4 3.7 5.4 2.6 0 4.5-1.4 4.5-3.6 0-2.5-2.1-3.6-5.4-4.9-4.6-1.9-7.4-4-7.4-8.3 0-4.2 3.7-7.8 9.4-7.8 6 0 8.7 2.9 8.7 5.3 0 2-1.8 3.9-4.8 3.2l-.6-.9c1.9-2.5.9-5.5-3.2-5.5-2.4 0-4.1 1.5-4.1 3.6 0 2.4 2.6 3.6 5.5 4.6 4.6 1.6 8.3 3.7 8.3 8.4.1 4.9-3.3 8.2-11.2 8.2zM81.4 3h29.2l.3 9.6h-2l-1-3c-1-3-3.1-3.9-6.2-3.9h-7.6v13.6h7.5c1.6 0 1.7-.3 2.8-5h2.1v13.1h-2.1c-1.1-4.5-1.2-5.2-2.8-5.2h-7.5v11.1c0 2.3.7 3.5 3.7 3.5h3.6c4.1 0 6-1.6 7.4-4.6l1.3-2.9 2.1.6-1.7 9.5H81.4v-2c5.2-1.1 5.4-1.3 5.4-3.3V8.3c0-2.1-.3-2.2-5.4-3.2V3zm53.4 29.9l1.2 1.4c-2.3 3.4-6.1 5.7-10.5 5.7-7.1 0-12.2-5.1-12.2-13 0-7.7 5.7-13.8 13.1-13.8 5.8 0 8.5 3.2 8.5 5.7 0 2.1-1.3 4.2-5.1 3.6l-.6-1c1-2.4 1.4-6.2-2.7-6.2-4.2 0-5.9 4.8-5.9 10.7 0 5.8 2.7 9.8 7.4 9.8 2.5-.1 4.7-1 6.8-2.9zm19.1 3.5V22.3c0-3-1.1-4.3-3.2-4.3-3.3 0-6.1 5.2-6.1 12.9v8.4h-6.9v-34c0-2-.2-2.1-3.5-3.2V0h10.7c-.3 2.2-.3 19.3-.3 20.4h.1c1.8-4.3 4.9-7.3 9.3-7.3 3.9 0 6.7 2.7 6.7 7.9v12.8c0 2.4.4 2.6 4 3.5v2.1c-3.1.3-5.6.5-7.1.5-2.4.1-3.7-1-3.7-3.5zm23.4 1.4c4.6 0 5.8-5.4 5.8-10.9 0-6-.8-11.6-5.8-11.6-4.6 0-5.8 5.4-5.8 10.9-.1 5.9.9 11.6 5.8 11.6zm-.6 2.2c-7.4 0-12.6-5-12.6-12.6 0-8.6 5.4-14.3 13.7-14.3 7.4 0 12.6 4.9 12.6 12.6 0 8.6-5.3 14.3-13.7 14.3zm23.7 0c-6.3 0-8.7-2.5-8.7-5.2 0-2 2-3.8 4.6-3.3l.7.8c-1.6 2.8-.4 5.4 3.7 5.4 2.6 0 4.5-1.4 4.5-3.6 0-2.5-2.1-3.6-5.4-4.9-4.6-1.9-7.4-4-7.4-8.3 0-4.2 3.7-7.8 9.3-7.8 6 0 8.7 2.9 8.7 5.3 0 2-1.8 3.9-4.8 3.2l-.6-.9c1.9-2.5 1-5.5-3.2-5.5-2.4 0-4.1 1.5-4.1 3.6 0 2.4 2.5 3.6 5.5 4.6 4.6 1.6 8.3 3.7 8.3 8.4.2 4.9-3.2 8.2-11.1 8.2z"></path></svg>`
  header$.html(innerHTML)
  header$.attr('class', '')
  header$.attr('style', 'box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 2px; z-index: 1;display: flex; align-items: center; height: 60px; justify-content: center;')

  // 5- convert links' urls from relative to absolute
  art$.find('a').each((i,el) => {
    const el$ = $(el)
    const href = el$.attr('href')
    el$.attr('href', resolve(href, article.baseUrl))
  })

  // 6- remove social media buttons
  art$.find('.SocialMediaShareButton').remove()


  // 7- in the end, inline assets in the html
  return inlineHtml({
    fileContent: article.html$.html(),
    relativeTo : article.baseUrl,
    images     : true,
    scripts    : false,
  }).then(inlined => {
    article.inlinedHtml = inlined
    return article
  })
}
