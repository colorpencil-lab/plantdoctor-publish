"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SESSION_UI, type ScanSession } from "@/lib/farm/model";
import type { Lang } from "@/lib/i18n";

/** Current local wall-clock time as a <input type="datetime-local"> value. */
function nowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-09-16T10:30" -> "2026-09-16T10:30:00" (this app's ISO-local-no-zone convention). */
function toSessionIso(inputValue: string): string {
  return inputValue.length === 16 ? `${inputValue}:00` : inputValue;
}

export default function NewSessionDialog({
  lang,
  onClose,
}: {
  lang: Lang;
  onClose: () => void;
}) {
  const f = SESSION_UI[lang];
  const router = useRouter();
  const [startedAt, setStartedAt] = useState(nowForInput());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startedAt: toSessionIso(startedAt) }),
      });
      const data = (await res.json().catch(() => null)) as
        | { session: ScanSession }
        | { error: string }
        | null;
      if (!res.ok || !data || "error" in data) {
        setError(
          res.status === 409
            ? f.alreadyInProgress
            : (data && "error" in data && data.error) || f.uploadFailed,
        );
        setBusy(false);
        return;
      }
      router.push(`/dashboard/${data.session.id}`);
      router.refresh();
    } catch {
      setError(f.uploadFailed);
      setBusy(false);
    }
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="dialog card" onClick={(e) => e.stopPropagation()}>
        <h2 className="section-title">{f.newDialogTitle}</h2>
        <label className="dialog-field">
          <span>{f.startTimeLabel}</span>
          <input
            type="datetime-local"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />
        </label>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {f.start}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            {f.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
