import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

interface UseServiceWorkerReturn {
  offlineReady: boolean;
  isChecking: boolean;
  checkForUpdates: () => Promise<void>;
}

function shouldSkipRegistration(): boolean {
  if (typeof window === "undefined") return true;
  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") || host.includes("lovableproject.com");
  return inIframe || isPreviewHost;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [offlineReady, setOfflineReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (shouldSkipRegistration()) {
      // Clean up any stale SW from previous registrations in preview/iframe
      navigator.serviceWorker?.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      return;
    }

    registerSW({
      immediate: true,
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisteredSW(_swUrl, reg) {
        if (reg) {
          setRegistration(reg);
          setInterval(() => {
            reg.update();
          }, 60 * 60 * 1000);
        }
      },
    });
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (registration) {
      setIsChecking(true);
      try {
        await registration.update();
      } finally {
        setIsChecking(false);
      }
    }
  }, [registration]);

  return { offlineReady, isChecking, checkForUpdates };
}
