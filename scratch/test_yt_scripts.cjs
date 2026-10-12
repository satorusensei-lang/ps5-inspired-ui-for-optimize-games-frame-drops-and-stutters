const https = require('https');

https.get('https://www.youtube.com/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const scriptMatches = html.match(/src="[^"]+"/g) || [];
    console.log('Script matches count:', scriptMatches.length);
    console.log('Sample script src:', scriptMatches.slice(0, 5));
    const relScripts = scriptMatches.filter(s => s.includes('/s/desktop/'));
    console.log('Desktop polymer scripts count:', relScripts.length);
  });
});
