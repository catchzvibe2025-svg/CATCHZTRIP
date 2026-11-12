// 重新生成 public/ 里的图标：暮色、落日、一道山脊
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [n, s] of [["icon-512.png", 512], ["icon-192.png", 192], ["apple-touch-icon.png", 180]]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#191540"/><stop offset=".55" stop-color="#a33a6e"/><stop offset=".8" stop-color="#f58c5a"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#g)"/>
      <circle cx="58" cy="60" r="13" fill="#ffd08a"/>
      <path d="M0 66 C 18 58, 34 70, 52 65 S 84 58, 100 66 V100 H0Z" fill="#7a3558"/>
      <path d="M0 78 C 22 70, 40 82, 60 76 S 88 72, 100 78 V100 H0Z" fill="#150d1c"/>
    </svg></body>`);
    await p.screenshot({ path: 'public/' + n });
  }
  await b.close();
})();
