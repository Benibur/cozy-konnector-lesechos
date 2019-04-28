const $  = require('cheerio')
const FS = require('fs')

const body$    = $.load(FS.readFileSync('explo/get_invoices_url.body.html', 'utf8'))

const invoices$ = body$('#main-content .invoice-download a')


invoices$.each((i, el)=>{
  console.log($(el).attr('href') )
})
