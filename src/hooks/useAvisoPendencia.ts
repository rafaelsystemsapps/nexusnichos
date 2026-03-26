import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseAvisoPendenciaProps {
  nichoId: string;
  enabled: boolean;
}

export function useAvisoPendencia({ nichoId, enabled }: UseAvisoPendenciaProps) {
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(() => {
    return localStorage.getItem(`lembretes_desktop_${nichoId}`) === "true";
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const hasNotifiedToday = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if already notified today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const notifiedKey = `lembretes_notified_${nichoId}_${today}`;
    hasNotifiedToday.current = localStorage.getItem(notifiedKey) === "true";
  }, [nichoId]);

  // Toggle desktop notifications
  const toggleDesktopNotifications = async () => {
    if (!desktopNotificationsEnabled) {
      // Request permission
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission !== "granted") {
          toast.error("Permissão para notificações negada");
          return;
        }
      }
      localStorage.setItem(`lembretes_desktop_${nichoId}`, "true");
      setDesktopNotificationsEnabled(true);
      toast.success("Notificações desktop ativadas");
    } else {
      localStorage.removeItem(`lembretes_desktop_${nichoId}`);
      setDesktopNotificationsEnabled(false);
      toast.info("Notificações desktop desativadas");
    }
  };

  // Check for pending reminders at 22:30
  useEffect(() => {
    if (!enabled) return;

    const checkTime = async () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Check if it's 22:30
      if (hours === 22 && minutes === 30 && !hasNotifiedToday.current) {
        await checkPendingReminders();
      }
    };

    const checkPendingReminders = async () => {
      const today = new Date().toISOString().split("T")[0];
      const notifiedKey = `lembretes_notified_${nichoId}_${today}`;

      // Already notified today
      if (localStorage.getItem(notifiedKey) === "true") {
        hasNotifiedToday.current = true;
        return;
      }

      try {
        const { data, error } = await supabase
          .from("lembretes_hoje")
          .select("id")
          .eq("nicho_id", nichoId)
          .eq("status", "pendente")
          .eq("data_criacao", today);

        if (error) throw error;

        if (data && data.length > 0) {
          const count = data.length;
          const message = `Você deixou ${count} tarefa${count > 1 ? "s" : ""} pendente${count > 1 ? "s" : ""} hoje.`;

          // In-app notification (always)
          toast.warning(message, {
            duration: 10000,
            icon: "🔔",
          });

          // Desktop notification (if enabled)
          if (desktopNotificationsEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Lembrete de Pendências", {
              body: message,
              icon: "/pwa-192x192.png",
              tag: `lembretes-${today}`,
            });
          }

          // Mark as notified
          localStorage.setItem(notifiedKey, "true");
          hasNotifiedToday.current = true;
        }
      } catch (error) {
        console.error("Erro ao verificar pendências:", error);
      }
    };

    // Check every minute
    intervalRef.current = setInterval(checkTime, 60000);

    // Initial check
    checkTime();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nichoId, enabled, desktopNotificationsEnabled]);

  return {
    desktopNotificationsEnabled,
    notificationPermission,
    toggleDesktopNotifications,
  };
}
