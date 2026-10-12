const https = require('https');

https.get('https://store.steampowered.com/api/appdetails?appids=851850', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('App 851850 details:');
      console.log('pc_requirements:', json['851850']?.data?.pc_requirements);
      console.log('dlc:', json['851850']?.data?.dlc?.length);
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', err => console.error(err));
