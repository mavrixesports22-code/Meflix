const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleNetMirror } = require('./lib/netmirror-service');

const PORT = process.env.PORT || 5173;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${host}`);

  // Route: NetMirror Service API
  if (await handleNetMirror(req, res, parsedUrl)) return;

  // Route: Health check
  if (parsedUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'Meflix', timestamp: new Date().toISOString() }));
    return;
  }

  // Static File Serving
  let reqPath = parsedUrl.pathname;
  if (reqPath === '/netflix' || reqPath === '/netflix/') {
    reqPath = '/index.html';
  } else if (reqPath.startsWith('/netflix/')) {
    reqPath = reqPath.slice('/netflix'.length);
  } else if (reqPath === '/') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ['.html', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=86400'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎬 Meflix running at http://localhost:${PORT}`);
});
