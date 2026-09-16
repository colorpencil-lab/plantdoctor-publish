// Shared browser-side helpers for turning a picked/dropped file into a
// downscaled data URL ready to POST. Used by Analyzer.tsx (single-photo
// checker) and PhotoUpload.tsx (session photo uploads).

export const MAX_DIMENSION = 1600; // downscale before upload to keep payloads small
export const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Load an image source and re-encode it, capped at MAX_DIMENSION on the long edge. */
export function downscale(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(
        1,
        MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight),
      );
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("image-load"));
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("file-read"));
    reader.readAsDataURL(file);
  });
}

/** Read + downscale one file, or throw one of "bad-type" | "too-large" | "read-failed". */
export async function loadImageFile(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error("bad-type");
  if (file.size > MAX_FILE_BYTES) throw new Error("too-large");
  let dataUrl: string;
  try {
    dataUrl = await readFileAsDataUrl(file);
  } catch {
    throw new Error("read-failed");
  }
  try {
    return await downscale(dataUrl);
  } catch {
    return dataUrl;
  }
}
