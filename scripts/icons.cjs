const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [n, s, r] of [["icon-512.png",512,0],["icon-192.png",192,0],["apple-touch-icon.png",180,0]]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<body style="margin:0"><div style="width:${s}px;height:${s}px;background:#1f5f73;display:grid;place-items:center;font:900 ${Math.round(s*0.52)}px 'Noto Serif CJK SC','Noto Serif SC',serif;color:#fff;position:relative">途<div style="position:absolute;left:${s*0.2}px;right:${s*0.2}px;bottom:${s*0.17}px;border-top:${Math.max(2,s*0.025)}px dashed #e8b54a"></div></div></body>`);
    await p.screenshot({ path: 'public/' + n });
  }
  await b.close();
})();
