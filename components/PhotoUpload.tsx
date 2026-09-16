"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { ACCEPTED, loadImageFile } from "@/lib/imageInput";
import { SESSION_UI, text, type PlantCheck } from "@/lib/farm/model";
import type { PhotoTotals } from "@/lib/farm/sessions";
import type { Lang } from "@/lib/i18n";

interface UploadResult {
  key: string;
  label: string;
  healthy: boolean;
}

export default function PhotoUpload({
  lang,
  sessionId,
  onResult,
  children,
}: {
  lang: Lang;
  sessionId: string;
  onResult: (totals: PhotoTotals, check: PlantCheck | null) => void;
  /** Rendered at the bottom of the upload card, e.g. an "End session" button. */
  children?: ReactNode;
}) {
  const f = SESSION_UI[lang];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadOne = async (file: File) => {
    let dataUrl: string;
    try {
      dataUrl = await loadImageFile(file);
    } catch {
      setError(f.uploadFailed);
      return;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, lang }),
      });
      const data = (await res.json().catch(() => null)) as
        | { unit: string; healthy: boolean; check: PlantCheck | null; totals: PhotoTotals }
        | { error: string }
        | null;
      if (!res.ok || !data || "error" in data) {
        setError((data && "error" in data && data.error) || f.uploadFailed);
        return;
      }
      const label = data.check
        ? f.uploadResultFlagged(text(data.check.issueTitle, lang))
        : f.uploadResultHealthy;
      setResults((prev) => [{ key: data.unit, label, healthy: data.healthy }, ...prev]);
      onResult(data.totals, data.check);
    } catch {
      setError(f.uploadFailed);
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setBusy(true);
    setError(null);
    for (const file of list) await uploadOne(file);
    setBusy(false);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void uploadFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void uploadFiles(e.dataTransfer.files);
  };

  return (
    <section className="card photo-upload">
      <h2 className="section-title">{f.uploadTitle}</h2>
      <p className="muted">{f.uploadHint}</p>

      <div
        className={`dropzone ${dragOver ? "is-drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <span className="dropzone-icon" aria-hidden="true">
          📷
        </span>
        <p className="dropzone-title">{busy ? f.uploading : f.uploadTitle}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          capture="environment"
          hidden
          onChange={onInputChange}
        />
      </div>

      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul className="upload-results">
          {results.map((r, i) => (
            <li key={`${r.key}-${i}`} className={r.healthy ? "chip chip-good" : "chip chip-bad"}>
              {r.key}: {r.label}
            </li>
          ))}
        </ul>
      )}

      {children}
    </section>
  );
}
