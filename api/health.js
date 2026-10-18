module.exports = (req, res) => {
  const configured = !process.env.VERCEL || Buffer.byteLength(process.env.SESSION_SECRET || '', 'utf8') >= 32;
  res.writeHead(configured ? 200 : 503, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify({
    status: configured ? 'healthy' : 'configuration_required',
    service: 'Meflix',
    timestamp: new Date().toISOString(),
    version: '1.0.1'
  }));
};
