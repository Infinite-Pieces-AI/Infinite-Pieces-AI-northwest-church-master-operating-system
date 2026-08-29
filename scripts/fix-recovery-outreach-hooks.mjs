import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/outreach-command/components/recovery-outreach-workspace.tsx";
let source = readFileSync(path, "utf8");

const oldImport = 'import { useEffect, useMemo, useState } from "react";';
const newImport = 'import { useCallback, useEffect, useMemo, useState } from "react";';
if (!source.includes(oldImport)) {
  throw new Error("Expected React import was not found");
}
source = source.replace(oldImport, newImport);

const refreshStart = source.indexOf("  async function refreshLive() {");
const sendLiveStart = source.indexOf("\n\n  async function sendLive", refreshStart);
if (refreshStart < 0 || sendLiveStart < 0) {
  throw new Error("Expected refreshLive block was not found");
}

const refreshFunction = source.slice(refreshStart, sendLiveStart);
const refreshCallback = refreshFunction
  .replace("  async function refreshLive() {", "  const refreshLive = useCallback(async () => {")
  .replace(/\n  }$/, "\n  }, []);");

source = `${source.slice(0, refreshStart)}${source.slice(sendLiveStart + 2)}`;

const firstEffectStart = source.indexOf("  useEffect(() => {");
const firstEffectClose = "  }, [mode]);";
const firstEffectCloseStart = source.indexOf(firstEffectClose, firstEffectStart);
if (firstEffectStart < 0 || firstEffectCloseStart < 0) {
  throw new Error("Expected initial mode effect was not found");
}
const firstEffectEnd = firstEffectCloseStart + firstEffectClose.length;

const safeModeEffect = `  useEffect(() => {
    if (mode === "showcase") {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return undefined;

      const frame = window.requestAnimationFrame(() => {
        try {
          const parsed = JSON.parse(stored) as RecoveryOutreachPayload;
          if (
            Array.isArray(parsed.partners) &&
            Array.isArray(parsed.topics) &&
            Array.isArray(parsed.inquiries)
          ) {
            setPayload(parsed);
            setSelectedInquiryId(parsed.inquiries[0]?.id ?? null);
          }
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      });

      return () => window.cancelAnimationFrame(frame);
    }

    void refreshLive();
    return undefined;
  }, [mode, refreshLive]);`;

source = `${source.slice(0, firstEffectStart)}${refreshCallback}\n\n${safeModeEffect}${source.slice(firstEffectEnd)}`;

writeFileSync(path, source, "utf8");
console.log("Recovery Outreach hooks were rewritten with stable callback and asynchronous storage hydration.");
