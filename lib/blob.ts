import { put } from "@vercel/blob";

// Saves a flagged plant's photo to Vercel Blob storage. Best-effort: returns
// null (never throws) if Blob isn't configured or the upload fails, so a
// missing/failed photo never blocks recording the plant check itself.

export async function savePhoto(
  pathname: string,
  bytes: Buffer,
  contentType: string,
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      "[blob] BLOB_READ_WRITE_TOKEN not set — skipping photo save. " +
        "Connect Vercel Blob from the Storage tab for production.",
    );
    return null;
  }
  try {
    const { url } = await put(pathname, bytes, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return url;
  } catch (e) {
    console.error("[blob] failed to save photo:", e);
    return null;
  }
}
