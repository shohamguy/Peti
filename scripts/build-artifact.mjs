// הופך את הבילד של מצב artifact לדף שמתאים ל-Artifact של claude.ai:
// בלי <html>/<head>/<body> (הפלטפורמה עוטפת), CSS מוטמע, וה-JS כקובץ נלווה.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist-artifact");
const html = readFileSync(path.join(out, "index.html"), "utf8");

const js = html.match(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"/)?.[1];
const css = html.match(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"/)?.[1];
if (!js || !css) throw new Error("could not find built assets in dist-artifact/index.html");
const styles = readFileSync(path.join(out, css), "utf8").replace(/<\/style/gi, "<\\/style");

const page = `<title>Peti</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="היומן המונפש של הכלב שלכם: טיולים, ארוחות, גדילה, חיסונים וטריקים.">
<!-- Peti: נבנה מהקוד ב-GitHub (shohamguy/Peti) עם npm run build:artifact. עורכים שם, לא כאן. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500..700&family=Rubik:wght@400..600&display=swap">
<style>${styles}</style>
<div id="root"></div>
<script type="module" src="${js}"></script>
`;
writeFileSync(path.join(out, "peti.html"), page);
const media = ["peti/idle.mp4", "peti/idle.jpg", "peti/face.jpg"];
writeFileSync(
  path.join(out, "files.json"),
  JSON.stringify({ [js]: path.join("dist-artifact", js), ...Object.fromEntries(media.map((m) => [m, path.join("public", m)])) }, null, 2),
);
console.log("artifact page: dist-artifact/peti.html");
console.log("supporting file:", js);
