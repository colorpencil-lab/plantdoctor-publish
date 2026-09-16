"use client";

import { useState } from "react";
import { SESSION_UI, type ScanSession } from "@/lib/farm/model";
import type { Lang } from "@/lib/i18n";

function nowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toSessionIso(inputValue: string): string {
  return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}

export default function EndSessionDialog({
  lang,
  sessionId,
  onClose,
  onEnded,
}: {
  lang: Lang;
  sessionId: string;
  onClose: () => void;
  onEnded: (session: ScanSession) => void;
}) {
  const f = SESSION_UI[lang];
  const [finishedAt, setFinishedAt] = useState(nowForInput());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finishedAt: toSessionIso(finishedAt) }),
      });
      const data = (await res.json().catch(() => null)) as
        | { session: ScanSession }
        | { error: string }
        | null;
      if (!res.ok || !data || "error" in data) {
        setError((data && "error" in data && data.error) || f.uploadFailed);
        setBusy(false);
        return;
      }
      onEnded(data.session);
    } catch {
      setError(f.uploadFailed);
      setBusy(false);
    }
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="dialog card" onClick={(e) => e.stopPropagation()}>
        <h2 className="section-title">{f.endDialogTitle}</h2>
        <label className="dialog-field">
          <span>{f.endTimeLabel}</span>
          <input
            type="datetime-local"
            value={finishedAt}
            onChange={(e) => setFinishedAt(e.target.value)}
          />
        </label>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {f.end}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            {f.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
