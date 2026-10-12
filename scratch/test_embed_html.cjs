const https = require('https');

https.get('https://www.youtube-nocookie.com/embed/QdBZY2fkU-0', (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const m = html.match(/"status":"([^"]+)"/);
    console.log('Playability status:', m ? m[1] : 'not found');
  });
});
