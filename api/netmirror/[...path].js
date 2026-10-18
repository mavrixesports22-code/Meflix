const { handleNetMirror } = require('../../lib/netmirror-service');

module.exports = async (req, res) => {
  try {
    let reqUrl = req.url || '/api/netmirror/home';
    if (!reqUrl.startsWith('/api/netmirror/')) {
      reqUrl = '/api/netmirror' + (reqUrl.startsWith('/') ? reqUrl : '/' + reqUrl);
    }
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(reqUrl, `${proto}://${host}`);

    const handled = await handleNetMirror(req, res, url);
    if (!handled && !res.headersSent) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
    }
  }
};
