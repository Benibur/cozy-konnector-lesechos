const $  = require('cheerio')
const FS = require('fs')

const html$ = $.load(FS.readFileSync('explo/get_key_form.body.html', 'utf8'))

const input$ = html$('#login-form input[name="form_key"]')

console.log(input$.attr('name'),input$.attr('value') )

input$.each((i, el)=>{
  console.log(i)
  console.log($(el).attr('name'),$(el).attr('value') )
})
