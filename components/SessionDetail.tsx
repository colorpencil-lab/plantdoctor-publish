"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FarmDashboard from "@/components/FarmDashboard";
import PhotoUpload from "@/components/PhotoUpload";
import EndSessionDialog from "@/components/EndSessionDialog";
import { useLang } from "@/lib/useLang";
import { SESSION_UI, sessionStatus, type ScanSession } from "@/lib/farm/model";
import type { PhotoTotals } from "@/lib/farm/sessions";

export default function SessionDetail({ session: initial }: { session: ScanSession }) {
  const [lang] = useLang();
  const f = SESSION_UI[lang];
  const router = useRouter();
  const [session, setSession] = useState(initial);
  const [showEnd, setShowEnd] = useState(false);

  const inProgress = sessionStatus(session) === "in_progress";

  const applyTotals = (totals: PhotoTotals, check: ScanSession["checks"][number] | null) => {
    setSession((prev) => ({
      ...prev,
      plantsScanned: totals.plantsScanned,
      plantsHealthy: totals.plantsHealthy,
      plantsFlagged: totals.plantsFlagged,
      checks: check ? [...prev.checks, check] : prev.checks,
    }));
    router.refresh();
  };

  return (
    <>
      {inProgress && (
        <div className="session-controls">
          <PhotoUpload lang={lang} sessionId={session.id} onResult={applyTotals}>
            <div className="button-row">
              <button className="btn btn-ghost" onClick={() => setShowEnd(true)}>
                {f.endSession}
              </button>
            </div>
          </PhotoUpload>
        </div>
      )}

      <FarmDashboard session={session} />

      {showEnd && (
        <EndSessionDialog
          lang={lang}
          sessionId={session.id}
          onClose={() => setShowEnd(false)}
          onEnded={(updated) => {
            setSession(updated);
            setShowEnd(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
