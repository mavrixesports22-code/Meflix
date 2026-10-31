const { handleAdmin } = require('../../lib/admin-backend.cjs');

module.exports = async (req, res) => {
  try {
    const handled = await handleAdmin(req, res);
    if (!handled && !res.writableEnded) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Endpoint not found.' }));
    }
  } catch (err) {
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Internal server error.' }));
    }
  }
};
