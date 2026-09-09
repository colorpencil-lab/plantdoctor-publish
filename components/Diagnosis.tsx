import type { AnalysisResult } from "@/lib/types";
import { UI, type Lang } from "@/lib/i18n";

// Shared presentation of an AnalysisResult, rendered in the chosen UI language.
// The enum values in the result stay English; labels come from lib/i18n.

const HEALTH_TONE: Record<AnalysisResult["health"]["status"], string> = {
  healthy: "good",
  minor_issues: "warn",
  serious_issues: "bad",
  unknown: "neutral",
};

const SEV_TONE: Record<string, string> = {
  low: "good",
  medium: "warn",
  high: "bad",
};

const URGENCY_TONE: Record<string, string> = {
  now: "bad",
  soon: "warn",
  ongoing: "neutral",
};

export function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function DemoNote({ lang }: { lang: Lang }) {
  const t = UI[lang];
  return (
    <div className="demo-note">
      {t.demoNoteBefore}
      <code>GEMINI_API_KEY</code>
      {t.demoNoteMid}
      <code>ANTHROPIC_API_KEY</code>
      {t.demoNoteAfter}
    </div>
  );
}

export function Diagnosis({
  result,
  lang,
  disclaimerSuffix = "",
}: {
  result: AnalysisResult;
  lang: Lang;
  disclaimerSuffix?: string;
}) {
  const t = UI[lang];

  if (!result.isPlant) {
    return (
      <div className="card">
        <h2 className="section-title">{t.noPlantTitle}</h2>
        <p>{t.noPlantBody}</p>
      </div>
    );
  }

  const care = [
    [t.care.light, result.care.light],
    [t.care.water, result.care.water],
    [t.care.soil, result.care.soil],
    [t.care.humidity, result.care.humidity],
    [t.care.temperature, result.care.temperature],
  ].filter(([, v]) => v);

  return (
    <>
      <div className="card id-card">
        <div className="id-head">
          <div>
            <p className="eyebrow">{t.identification}</p>
            <h2 className="plant-name">{result.identification.commonName}</h2>
            {result.identification.scientificName && (
              <p className="plant-sci">{result.identification.scientificName}</p>
            )}
          </div>
          <Chip tone="neutral">
            {t.confidence(result.identification.confidence)}
          </Chip>
        </div>
        {result.identification.notes && (
          <p className="muted">{result.identification.notes}</p>
        )}
      </div>

      <div
        className={`card health-card health-${HEALTH_TONE[result.health.status]}`}
      >
        <div className="health-head">
          <span className="health-dot" aria-hidden="true" />
          <h2 className="section-title">
            {t.healthLabel[result.health.status]}
          </h2>
        </div>
        <p>{result.health.summary}</p>
        {result.health.recovery &&
          result.health.recovery !== "not_applicable" && (
            <p className="recovery-line">
              {t.recoveryOutlook[result.health.recovery]}
            </p>
          )}
      </div>

      {result.issues.length > 0 && (
        <div className="card detail-card">
          <h2 className="section-title">{t.issuesTitle(result.issues.length)}</h2>
          <ul className="issue-list">
            {result.issues.map((issue, i) => (
              <li key={i} className="issue">
                <div className="issue-head">
                  <span className="issue-name">{issue.name}</span>
                  <span className="issue-chips">
                    <Chip tone="neutral">{t.issueType[issue.type]}</Chip>
                    <Chip tone={SEV_TONE[issue.severity]}>
                      {t.severity(issue.severity)}
                    </Chip>
                  </span>
                </div>
                <p>{issue.description}</p>
                {issue.evidence && (
                  <p className="evidence">
                    <strong>{t.inThePhoto}</strong> {issue.evidence}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.treatment.length > 0 && (
        <div className="card detail-card">
          <h2 className="section-title">{t.treatmentTitle}</h2>
          <ol className="steps">
            {result.treatment.map((step, i) => (
              <li key={i} className="step">
                <div className="step-head">
                  <span className="step-title">{step.title}</span>
                  <Chip tone={URGENCY_TONE[step.urgency]}>
                    {t.urgency[step.urgency]}
                  </Chip>
                </div>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {result.prevention.length > 0 && (
        <div className="card detail-card">
          <h2 className="section-title">{t.preventionTitle}</h2>
          <ul className="bullets">
            {result.prevention.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {care.length > 0 && (
        <div className="card detail-card">
          <h2 className="section-title">{t.careTitle}</h2>
          <dl className="care-grid">
            {care.map(([label, value]) => (
              <div key={label} className="care-item">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <p className="disclaimer">
        {result.disclaimer}
        {disclaimerSuffix}
      </p>
    </>
  );
}
