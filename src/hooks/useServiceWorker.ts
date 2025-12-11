import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

interface UseServiceWorkerReturn {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: () => Promise<void>;
  close: () => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisteredSW(swUrl, registration) {
        if (registration) {
          // Check for updates every hour
          setInterval(() => {
            registration.update();
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

  const close = useCallback(() => {
    setNeedRefresh(false);
    setOfflineReady(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: handleUpdate,
    close,
  };
}
