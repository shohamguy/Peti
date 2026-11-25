import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

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
        "peti/idle.mp4",
        "peti/idle.jpg",
        "peti/face.jpg",
      ];
      const precache = ["./", ...[...files, ...statics].map((f) => "./" + f)];
      // הגרסה משתנה גם כשקובץ סטטי (למשל קליף חדש של Peti) מתעדכן
      const hash = createHash("sha1").update(files.sort().join("|"));
      for (const f of statics) if (existsSync("public/" + f)) hash.update(readFileSync("public/" + f));
      const version = hash.digest("hex").slice(0, 10);
      this.emitFile({ type: "asset", fileName: "sw.js", source: swSource(version, precache) });
    },
  };
}

function swSource(version: string, precache: string[]) {
  return `// Peti service worker (נוצר אוטומטית בבילד)
const VERSION = "peti-${version}";
const FONTS = "peti-fonts";
const PRECACHE = ${JSON.stringify(precache)};

async function videoResponse(req) {
  const cache = await caches.open(VERSION);
  let res = await cache.match(req.url, { ignoreSearch: true, ignoreVary: true });
  if (!res) {
    try {
      res = await fetch(req.url);
      if (res.ok) await cache.put(req.url, res.clone());
    } catch {
      return new Response("", { status: 504 });
    }
  }
  const range = req.headers.get("range");
  if (!range || !res.ok) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const size = buf.byteLength;
  let start = m && m[1] ? Number(m[1]) : 0;
  let end = m && m[2] ? Number(m[2]) : size - 1;
  if (m && !m[1] && m[2]) {
    start = size - Number(m[2]);
    end = size - 1;
  }
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(end - start + 1),
      "Content-Range": "bytes " + start + "-" + end + "/" + size,
      "Accept-Ranges": "bytes",
    },
  });
}

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

  // וידאו: ספארי מבקש טווחי בתים (Range), אז מגישים חלקים מתוך הקובץ השמור
  if (url.pathname.endsWith(".mp4")) {
    e.respondWith(videoResponse(req));
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put("./", copy)); return r; })
        .catch(() => caches.match("./", { ignoreVary: true })),
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(
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
