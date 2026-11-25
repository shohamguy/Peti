// יוצר את אייקוני האפליקציה מ-SVG (דורש playwright): node scripts/make-icons.js
const { chromium } = require("playwright");
const path = require("path");

const svg = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ff6a3d"/><stop offset="1" stop-color="#ff9a52"/></linearGradient></defs>
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="url(#g)"/>
  <g transform="translate(256 262) scale(${pad ? 0.72 : 1}) translate(-256 -262)">
    <rect x="136" y="186" width="240" height="170" rx="28" fill="#fff"/>
    <path d="M206 186v-24a26 26 0 0 1 26-26h48a26 26 0 0 1 26 26v24" fill="none" stroke="#fff" stroke-width="26"/>
    <rect x="136" y="250" width="240" height="14" fill="#ffd2c1"/>
    <rect x="236" y="238" width="40" height="38" rx="9" fill="#ff6a3d"/>
  </g>
</svg>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = (f) => path.join(__dirname, "..", "public", "icons", f);
  const jobs = [
    ["icon-192.png", 192, false],
    ["icon-512.png", 512, false],
    ["maskable-512.png", 512, true],
    ["apple-touch-icon.png", 180, true],
  ];
  for (const [file, size, pad] of jobs) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg(pad)}`);
    await page.screenshot({ path: out(file), omitBackground: true });
  }
  await browser.close();
})();
