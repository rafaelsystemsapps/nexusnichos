import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

interface UseServiceWorkerReturn {
  needRefresh: boolean;
  offlineReady: boolean;
  isChecking: boolean;
  updateServiceWorker: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  close: () => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisteredSW(swUrl, reg) {
        if (reg) {
          setRegistration(reg);
          // Check for updates every hour
          setInterval(() => {
            reg.update();
          }, 60 * 60 * 1000);
        }
      },
    });

    setUpdateSW(() => updateServiceWorker);
  }, []);

  const handleUpdate = useCallback(async () => {
    if (updateSW) {
      await updateSW();
    }
  }, [updateSW]);

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

  const close = useCallback(() => {
    setNeedRefresh(false);
    setOfflineReady(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    isChecking,
    updateServiceWorker: handleUpdate,
    checkForUpdates,
    close,
  };
}
