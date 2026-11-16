const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function page(code){
 const dom=new JSDOM(fs.readFileSync('public/connect.html','utf8'),{url:'https://meflix-roan.vercel.app/connect.html?code='+encodeURIComponent(code),runScripts:'outside-only'});
 dom.window.eval(fs.readFileSync('public/connect.js','utf8'));return dom;
}
test('camera-friendly HTTPS QR hands off to Meflix without another login form',()=>{
 const dom=page('ABCD-EFGH'),doc=dom.window.document;
 assert.equal(doc.querySelector('#open').href,'meflix://tv?code=ABCDEFGH');
 assert.equal(doc.querySelector('#code').textContent,'ABCD-EFGH');
 assert.equal(doc.querySelectorAll('input,form').length,0);
 assert.equal(dom.window.location.search,'');dom.window.close();
});
test('invalid QR input cannot turn the app handoff into an arbitrary link',()=>{
 const dom=page('https://evil.test'),doc=dom.window.document;
 assert.equal(doc.querySelector('#open').hidden,true);
 assert.equal(doc.querySelector('#open').hasAttribute('href'),false);dom.window.close();
});
