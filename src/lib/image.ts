function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

/**
 * מקטין תמונה ל-JPEG קומפקטי (data URL).
 * square=true חותך ריבוע מהמרכז (לתמונת פרופיל).
 */
export async function imageToDataUrl(file: Blob, max = 720, square = false, limit = 230_000): Promise<string> {
  const img = await loadImage(file);
  const w0 = img.naturalWidth;
  const h0 = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let sw = w0;
  let sh = h0;
  if (square) {
    const s = Math.min(w0, h0);
    sx = (w0 - s) / 2;
    sy = (h0 - s) / 2;
    sw = sh = s;
  }
  let size = max;
  let quality = 0.8;
  for (let i = 0; i < 6; i++) {
    const scale = Math.min(1, size / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * scale);
    canvas.height = Math.round(sh * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length <= limit) return url;
    quality = Math.max(0.5, quality - 0.1);
    size = Math.round(size * 0.85);
  }
  throw new Error("image too large");
}
