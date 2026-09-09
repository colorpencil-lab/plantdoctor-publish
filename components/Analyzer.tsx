"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import type {
  AnalysisResult,
  AnalyzeErrorResponse,
  AnalyzeResponse,
} from "@/lib/types";
import { UI, type Lang } from "@/lib/i18n";
import { DEMO_PHOTOS, demoPhotoLabel } from "@/lib/fixtures/photos";
import { Diagnosis, DemoNote } from "@/components/Diagnosis";

type Status = "idle" | "loading" | "done" | "error";
type Mode = "upload" | "camera";

const MAX_DIMENSION = 1600; // downscale before upload to keep payloads small
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Load an image source and re-encode it, capped at MAX_DIMENSION on the long edge. */
function downscale(src: string): Promise<string> {
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("file-read"));
    reader.readAsDataURL(file);
  });
}

export default function Analyzer({ lang }: { lang: Lang }) {
  const t = UI[lang];

  const [mode, setMode] = useState<Mode>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [fixtureId, setFixtureId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [demo, setDemo] = useState(false);
  const [fixture, setFixture] = useState(false);
  const [modelName, setModelName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const acceptImage = useCallback(
    async (raw: string) => {
      setError(null);
      try {
        const scaled = await downscale(raw);
        setFixtureId(null);
        setImage(scaled);
        setResult(null);
        setStatus("idle");
      } catch {
        setError(t.errLoadImage);
        setStatus("error");
      }
    },
    [t],
  );

  const pickDemo = useCallback(
    (id: string, src: string) => {
      stopCamera();
      setError(null);
      setResult(null);
      setStatus("idle");
      setFixtureId(id);
      setImage(src);
    },
    [stopCamera],
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!ACCEPTED.includes(file.type)) {
        setError(t.errBadType);
        setStatus("error");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError(t.errTooLarge);
        setStatus("error");
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        await acceptImage(dataUrl);
      } catch {
        setError(t.errReadFile);
        setStatus("error");
      }
    },
    [acceptImage, t],
  );

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    if (next === "upload") stopCamera();
    setCameraError(null);
    setMode(next);
  };

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t.cameraNoApi);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraError(t.cameraDenied);
    }
  }, [t]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const shot = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    await acceptImage(shot);
  }, [acceptImage, stopCamera]);

  const analyze = useCallback(async () => {
    if (!image && !fixtureId) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fixtureId ? { fixtureId, lang } : { image, lang }),
      });
      if (!res.ok) {
        const data = (await res
          .json()
          .catch(() => null)) as AnalyzeErrorResponse | null;
        throw new Error(data?.error || t.errRequestFailed(res.status));
      }
      const data = (await res.json()) as AnalyzeResponse;
      setResult(data.result);
      setDemo(data.demo);
      setFixture(data.fixture ?? false);
      setModelName(data.model);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errAnalysisFailed);
      setStatus("error");
    }
  }, [image, fixtureId, lang, t]);

  const reset = () => {
    stopCamera();
    setImage(null);
    setFixtureId(null);
    setResult(null);
    setError(null);
    setStatus("idle");
  };

  const hasOutput = status === "loading" || (status === "done" && !!result);

  return (
    <section className={`analyzer ${hasOutput ? "has-output" : ""}`}>
      <div className="card capture-card">
        <div className="tabs" role="tablist" aria-label={t.tabsAria}>
          <button
            role="tab"
            aria-selected={mode === "upload"}
            className={`tab ${mode === "upload" ? "is-active" : ""}`}
            onClick={() => switchMode("upload")}
          >
            {t.tabUpload}
          </button>
          <button
            role="tab"
            aria-selected={mode === "camera"}
            className={`tab ${mode === "camera" ? "is-active" : ""}`}
            onClick={() => switchMode("camera")}
          >
            {t.tabCamera}
          </button>
        </div>

        {!image && mode === "upload" && (
          <div
            className={`dropzone ${dragOver ? "is-drag" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
          >
            <span className="dropzone-icon" aria-hidden="true">
              📷
            </span>
            <p className="dropzone-title">{t.dropTitle}</p>
            <p className="dropzone-hint">{t.dropHint}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={onInputChange}
            />
          </div>
        )}

        {!image && mode === "upload" && DEMO_PHOTOS.length > 0 && (
          <div className="demo-strip">
            <p className="demo-strip-label">{t.demoStripLabel}</p>
            <div className="demo-thumbs">
              {DEMO_PHOTOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="demo-thumb"
                  onClick={() => pickDemo(p.id, p.image)}
                  title={demoPhotoLabel(p, lang)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={demoPhotoLabel(p, lang)} />
                  <span>{demoPhotoLabel(p, lang)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!image && mode === "camera" && (
          <div className="camera">
            <div className="camera-stage">
              <video
                ref={videoRef}
                className={`camera-video ${cameraOn ? "is-live" : ""}`}
                playsInline
                muted
              />
              {!cameraOn && (
                <div className="camera-placeholder">
                  <span aria-hidden="true">🎥</span>
                  <p>{t.cameraPlaceholder}</p>
                </div>
              )}
            </div>
            {cameraError && <p className="inline-error">{cameraError}</p>}
            <div className="button-row">
              {!cameraOn ? (
                <button className="btn btn-primary" onClick={startCamera}>
                  {t.cameraStart}
                </button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={capture}>
                    {t.cameraCapture}
                  </button>
                  <button className="btn btn-ghost" onClick={stopCamera}>
                    {t.cameraStop}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {image && (
          <div className="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="preview-img" src={image} alt={t.previewAlt} />
            <div className="button-row">
              <button
                className="btn btn-primary"
                onClick={analyze}
                disabled={status === "loading"}
              >
                {status === "loading" ? t.analysing : t.analyse}
              </button>
              <button
                className="btn btn-ghost"
                onClick={reset}
                disabled={status === "loading"}
              >
                {t.chooseAnother}
              </button>
            </div>
          </div>
        )}

        {error && status === "error" && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {status === "loading" && (
        <div className="card loading-card">
          <div className="spinner" aria-hidden="true" />
          <p>{t.loading}</p>
        </div>
      )}

      {status === "done" && result && (
        <div className="results">
          {fixture ? (
            <p className="saved-demo-note">{t.savedDemo}</p>
          ) : (
            demo && <DemoNote lang={lang} />
          )}
          <Diagnosis
            result={result}
            lang={lang}
            disclaimerSuffix={
              modelName && !demo ? t.analysedBy(modelName) : ""
            }
          />
        </div>
      )}
    </section>
  );
}
