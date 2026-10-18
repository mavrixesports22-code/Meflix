module.exports = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    service: 'Meflix',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }));
};
