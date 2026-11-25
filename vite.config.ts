import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";

/**
 * יוצר service worker עם רשימת כל הקבצים של הבילד, כדי שהאפליקציה
 * תעבוד גם בלי אינטרנט אחרי הפתיחה הראשונה.
 */
function serviceWorker(): Plugin {
  return {
    name: "peti-sw",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith(".map") && f !== "index.html");
      const statics = [
        "manifest.webmanifest",
        "icons/icon.svg",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-512.png",
        "icons/apple-touch-icon.png",
      ];
      const precache = ["./", ...[...files, ...statics].map((f) => "./" + f)];
      const version = createHash("sha1").update(files.sort().join("|")).digest("hex").slice(0, 10);
      this.emitFile({ type: "asset", fileName: "sw.js", source: swSource(version, precache) });
    },
  };
}

function swSource(version: string, precache: string[]) {
  return `// Peti service worker (נוצר אוטומטית בבילד)
const VERSION = "peti-${version}";
const FONTS = "peti-fonts";
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONTS).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      }),
    );
    return;
  }
  if (url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put("./", copy)); return r; })
        .catch(() => caches.match("./")),
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) => hit || fetch(req).then((r) => {
        if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return r;
      }),
    ),
  );
});
`;
}

export default defineConfig(({ mode }) => {
  const artifact = mode === "artifact";
  return {
    base: "./",
    plugins: [react(), ...(artifact ? [] : [serviceWorker()])],
    define: { __TARGET__: JSON.stringify(artifact ? "artifact" : "pwa") },
    build: {
      outDir: artifact ? "dist-artifact" : "dist",
      emptyOutDir: true,
      target: "es2020",
      // בגרסת ה-Artifact תיקיית public (manifest, אייקונים) לא נדרשת
      copyPublicDir: !artifact,
    },
  };
});
