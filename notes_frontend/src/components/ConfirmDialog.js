import React, { useEffect, useRef } from "react";

// PUBLIC_INTERFACE
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  /** Accessible confirm dialog modal (Esc closes, focus trap basic, autofocus cancel). */
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Prefer focusing the cancel button first to avoid accidental destructive actions.
    window.setTimeout(() => cancelRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
      if (e.key === "Tab") {
        // Minimal focus trap: cycle between the two buttons.
        const focusables = [cancelRef.current, confirmRef.current].filter(
          Boolean
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        // Click outside closes (but not when busy).
        if (isBusy) return;
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
      >
        <div className="modal-header">
          <div className="modal-title" id="confirm-title">
            {title}
          </div>
        </div>

        <div className="modal-body" id="confirm-desc">
          {description}
        </div>

        <div className="modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
