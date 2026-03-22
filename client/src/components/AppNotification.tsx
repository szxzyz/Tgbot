import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "@/lib/utils";

export type NotificationType = "success" | "error" | "info";

interface NotificationData {
  message: string;
  type?: NotificationType;
  amount?: number;
  duration?: number;
}

let notificationQueue: NotificationData[] = [];
let isDisplaying = false;
let recentNotifications: Map<string, number> = new Map();

const DUPLICATE_PREVENTION_WINDOW = 2000;

export default function AppNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("success");

  const showNextNotification = () => {
    if (notificationQueue.length === 0 || isDisplaying) return;

    isDisplaying = true;
    const notification = notificationQueue.shift()!;

    setMessage(notification.message);
    setType(notification.type || "success");
    setIsVisible(true);

    const displayDuration = notification.duration || 1500;

    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        isDisplaying = false;
        showNextNotification();
      }, 300);
    }, displayDuration);
  };

  useEffect(() => {
    const handleNotification = (event: CustomEvent<NotificationData>) => {
      const { message: msg, type: notifType, amount, duration } = event.detail;

      let finalMessage = msg;
      if (amount !== undefined) {
        finalMessage = `${msg} +${formatCurrency(amount, false)}`;
      }

      const notificationKey = `${finalMessage}-${notifType}`;
      const now = Date.now();
      const lastShown = recentNotifications.get(notificationKey);

      if (lastShown && (now - lastShown) < DUPLICATE_PREVENTION_WINDOW) return;

      recentNotifications.set(notificationKey, now);

      for (const [key, timestamp] of Array.from(recentNotifications.entries())) {
        if (now - timestamp > 5000) recentNotifications.delete(key);
      }

      notificationQueue.push({ message: finalMessage, type: notifType, duration });
      showNextNotification();
    };

    window.addEventListener('appNotification', handleNotification as EventListener);
    return () => window.removeEventListener('appNotification', handleNotification as EventListener);
  }, []);

  if (!isVisible) return null;

  const ACCENT = "#C6F135";

  const getBg = () => {
    if (type === "error") return "#ef4444";
    if (type === "info") return "#1a1a2e";
    return ACCENT;
  };

  const getTextColor = () => {
    if (type === "error") return "#ffffff";
    if (type === "info") return ACCENT;
    return "#000000";
  };

  const getBorder = () => {
    if (type === "error") return "1px solid rgba(239,68,68,0.5)";
    if (type === "info") return `1px solid ${ACCENT}40`;
    return `1px solid ${ACCENT}60`;
  };

  const getIcon = () => {
    if (type === "success") return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
    if (type === "error") return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  };

  const notificationElement = (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2.5 max-w-[88vw]"
      style={{
        background: getBg(),
        color: getTextColor(),
        border: getBorder(),
        boxShadow: type === "success"
          ? `0 0 20px rgba(198,241,53,0.25), 0 8px 32px rgba(0,0,0,0.5)`
          : type === "info"
          ? `0 0 16px rgba(198,241,53,0.1), 0 8px 32px rgba(0,0,0,0.5)`
          : `0 8px 32px rgba(0,0,0,0.5)`,
        animation: "slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div
        className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
        style={{ background: type === "success" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }}
      >
        {getIcon()}
      </div>
      <span className="whitespace-nowrap text-xs font-bold tracking-tight">{message}</span>
    </div>
  );

  return createPortal(notificationElement, document.body);
}

export function showNotification(message: string, type: NotificationType = "success", amount?: number, duration?: number) {
  const event = new CustomEvent('appNotification', {
    detail: { message, type, amount, duration },
  });
  window.dispatchEvent(event);
}
