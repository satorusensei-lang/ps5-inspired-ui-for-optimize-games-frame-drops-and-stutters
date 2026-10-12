const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  console.log('[Proxy Request]', req.method, parsed.path);

  const targetPath = parsed.path;
  const options = {
    hostname: 'www.youtube.com',
    port: 443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'www.youtube.com',
      referer: 'https://www.youtube.com/',
      'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  };

  // Remove host-specific headers
  delete options.headers['host'];
  options.headers['host'] = 'www.youtube.com';

  const proxyReq = https.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    delete headers['x-frame-options'];
    delete headers['content-security-policy'];
    delete headers['content-security-policy-report-only'];
    delete headers['cross-origin-opener-policy'];
    headers['access-control-allow-origin'] = '*';

    // If html, we can inspect or modify
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy Error]', err.message);
    res.writeHead(500);
    res.end(err.message);
  });

  req.pipe(proxyReq);
});

server.listen(5199, () => {
  console.log('YouTube proxy running on http://localhost:5199');
});
