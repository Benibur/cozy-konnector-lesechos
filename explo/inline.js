const inline     = require('web-resource-inliner')
const Promise    = require('bluebird')
const inlineHtml = Promise.promisify(inline.html)
const fs         = require('fs')
const $          = require('cheerio')
const resolve    = require("resolve-relative-url")

const rawHtml = fs.readFileSync('explo/inline-test.html', 'utf8')
const html$   = $.load(rawHtml)

const baseUrl = 'https://www.lesechos.fr/rep1/rep2/'  // last / is important in case of dirs after TLD

console.log('cas-01',resolve('xyz', baseUrl))
console.log('cas-02',resolve('/xyz', baseUrl))
console.log('cas-03',resolve('../xyz', baseUrl))
console.log('cas-04',resolve('#var=2', baseUrl))


html$('a').each((i,el) => {
  const el$ = $(el)
  const href = el$.attr('href')
  console.log(resolve(href, baseUrl));
  el$.attr('href', resolve(href, baseUrl))
})

return inlineHtml({
  fileContent: html$.html(),
  relativeTo : 'https://www.lesechos.fr/',
  images     : true,
  scripts    : false,
}).then(inlined => {
  require('fs').writeFileSync('explo/inline-test.inlined.html', inlined)
})
