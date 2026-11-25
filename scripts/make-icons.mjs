// יוצר את אייקוני ה-PNG מתוך public/icons/icon.svg (דורש playwright): npm run icons
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
const svg = readFileSync(path.join(dir, "icon.svg"), "utf8");
// גרסת maskable: בלי פינות מעוגלות ועם שוליים בטוחים
const maskable = svg.replace('rx="116"', 'rx="0"').replace("scale(2.2)", "scale(1.75)");

const jobs = [
  ["icon-192.png", 192, svg],
  ["icon-512.png", 512, svg],
  ["maskable-512.png", 512, maskable],
  ["apple-touch-icon.png", 180, maskable],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, src] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${src}`);
  await page.screenshot({ path: path.join(dir, file), omitBackground: true });
}
await browser.close();
console.log("icons written");
