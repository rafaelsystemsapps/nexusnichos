import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ----- Boot version check: invalidate legacy local state on version bump -----
const APP_VERSION = "0.0.6.4";
const VERSION_KEY = "nexus_app_version";

try {
  const stored = localStorage.getItem(VERSION_KEY);
  if (stored !== APP_VERSION) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      // Preserve auth (Supabase) and version marker
      if (key.startsWith("sb-") || key.startsWith("supabase.") || key === VERSION_KEY) {
        continue;
      }
      // Drop legacy Nexus UI/state caches (incluindo planner legado em localStorage)
      if (
        key === "nexus_perfil_ativo" ||
        key.startsWith("nexus:") ||
        key.startsWith("nexus_planejamento_") ||
        key.startsWith("nexus_tarefas_") ||
        key.startsWith("nexus_ideias_") ||
        key.startsWith("nexus_meta_videos_") ||
        key.startsWith("nexus_videos_hoje_") ||
        key.startsWith("nexus_data_hoje_") ||
        key.startsWith("nexus_routine_")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }
} catch {
  // localStorage may be unavailable; ignore
}

// Best-effort: force SW update check on boot
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.update().catch(() => {}));
  }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
