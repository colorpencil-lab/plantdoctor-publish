import type { ScanSession } from "./model";
import data from "./demo-scan.json";

// The scan session shown on the dashboard until a real camera unit is wired in.
// Regenerate with `npm run farm-demo`; edit lib/farm/demo-scan.json by hand.
export const DEMO_SESSION = data as unknown as ScanSession;
