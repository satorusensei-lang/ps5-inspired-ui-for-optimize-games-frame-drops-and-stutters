const fs = require('fs');
const svg = fs.readFileSync('public/assets/games/valorant/ps5_logo.svg', 'utf8');
const html = `<!DOCTYPE html>
<html>
<body style="margin:0;background:transparent;">
  <img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="1030" height="148" id="img" />
  <canvas id="cv" width="1030" height="148" style="display:none;"></canvas>
  <script>
    window.onload = () => {
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      ctx.drawImage(document.getElementById('img'), 0, 0);
      const dataUrl = cv.toDataURL('image/png');
      const b64 = dataUrl.split(',')[1];
      console.log('PNG_B64_START:' + b64 + ':PNG_B64_END');
    };
  </script>
</body>
</html>`;

fs.writeFileSync('scratch/render_logo.html', html);
console.log('Written scratch/render_logo.html');
