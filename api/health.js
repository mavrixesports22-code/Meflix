module.exports = async (req, res) => {
  const probes = {};
  const testUrls = [
    { name: 'search_std', url: 'https://tv.imgcdn.kim/newtv/search.php?s=Stranger', headers: { 'Ott': 'nf', 'Usertoken': 'none', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } },
    { name: 'search_referer', url: 'https://tv.imgcdn.kim/newtv/search.php?s=Stranger', headers: { 'Ott': 'nf', 'Usertoken': 'none', 'Referer': 'https://net52.cc', 'Origin': 'https://net52.cc', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } },
    { name: 'artwork_imgcdn', url: 'https://imgcdn.kim/poster/v/80057281.jpg', headers: { 'Referer': 'https://net52.cc', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } },
    { name: 'discovery_mobiledetect', url: 'https://mobiledetect.app/checknewtv.php', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' } }
  ];

  for (const t of testUrls) {
    try {
      const resp = await fetch(t.url, { headers: t.headers, signal: AbortSignal.timeout(6000) });
      const text = await resp.text();
      probes[t.name] = {
        status: resp.status,
        headers: Object.fromEntries(resp.headers.entries()),
        preview: text.slice(0, 300)
      };
    } catch (e) {
      probes[t.name] = { error: e.message };
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'healthy',
    service: 'Meflix',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    probes
  }, null, 2));
};
