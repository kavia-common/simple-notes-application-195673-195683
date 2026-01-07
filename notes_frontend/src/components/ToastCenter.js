import React, { useEffect, useMemo, useState } from "react";

function id() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toneToRole(tone) {
  if (tone === "danger") return "alert";
  return "status";
}

// PUBLIC_INTERFACE
export default function ToastCenter({ toasts, onDismiss }) {
  /** Renders toast notifications (non-blocking success/error/info messages). */
  return (
    <div className="toast-center" aria-label="Notifications">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.tone || "info"}`}
          role={toneToRole(t.tone)}
          aria-live="polite"
        >
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.message ? <div className="toast-message">{t.message}</div> : null}
            {t.action ? (
              <button
                type="button"
                className="toast-action"
                onClick={t.action.onClick}
              >
                {t.action.label}
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
export function useToasts() {
  /** Hook to create and manage toast notifications. */
  const [toasts, setToasts] = useState([]);

  const api = useMemo(() => {
    function dismiss(toastId) {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }

    function push({ tone = "info", title, message, action, ttlMs = 5000 }) {
      const toast = { id: id(), tone, title, message, action, ttlMs };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      return toast.id;
    }

    function success(title, message, opts = {}) {
      return push({ tone: "success", title, message, ...opts });
    }

    function error(title, message, opts = {}) {
      return push({ tone: "danger", title, message, ttlMs: 8000, ...opts });
    }

    function info(title, message, opts = {}) {
      return push({ tone: "info", title, message, ...opts });
    }

    return { push, success, error, info, dismiss };
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) => {
      if (!t.ttlMs) return null;
      return window.setTimeout(() => api.dismiss(t.id), t.ttlMs);
    });

    return () => timers.forEach((x) => (x ? window.clearTimeout(x) : null));
  }, [api, toasts]);

  return { toasts, ...api };
}
