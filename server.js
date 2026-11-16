const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
if (require.main === module) require('./lib/local-env.cjs').loadLocalEnvironment(__dirname);
const { handleAdmin } = require('./lib/admin-backend.cjs');
const { handleTV } = require('./lib/tv-auth-backend.cjs');

const files = new Map([
  ['/connect.html', 'connect.html'], ['/connect.js', 'connect.js'], ['/connect.css', 'connect.css'],
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/admin.css', 'admin.css'],
  ['/admin.js', 'admin.js'],
  ['/model.js', 'model.js'],
  ['/firebase-config.js', 'firebase-config.js'],
  ['/google-signin.html', 'google-signin.html'],
  ['/google-signin.js', 'google-signin.js'],
  ['/google-signin.css', 'google-signin.css'],
  ['/google-callback.html', 'google-callback.html'],
  ['/tv.html', 'tv.html'], ['/tv.js', 'tv.js'], ['/tv.css', 'tv.css']
]);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://www.gstatic.com https://apis.google.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.com; frame-src https://meflix-544c6.firebaseapp.com https://accounts.google.com; img-src 'self' data: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );

  if (await handleAdmin(req, res)) return;
  if (await handleTV(req, res)) return;

  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ service: 'Meflix Admin', status: 'ready' }));
    return;
  }

  const name = files.get(pathname);
  if (!name) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const bytes = fs.readFileSync(path.join(__dirname, 'public', name));
  if (pathname === '/google-signin.html') res.setHeader('X-Meflix-Auth-Version', '1');
  res.setHeader('Content-Type', mime[path.extname(name)] || 'application/octet-stream');
  res.end(req.method === 'HEAD' ? undefined : bytes);
}

if (require.main === module) {
  const port = process.env.PORT || 5173;
  http.createServer((req,res) => {
    Promise.resolve(handler(req,res)).catch(() => {
      if(!res.headersSent)res.writeHead(500,{'Content-Type':'text/plain'});
      res.end('Server error');
    });
  }).listen(port, () => console.log(`Meflix Admin: http://localhost:${port}`));
}

module.exports = { handler };
