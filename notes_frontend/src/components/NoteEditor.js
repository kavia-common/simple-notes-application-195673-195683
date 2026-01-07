import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatDateTime } from "../utils/date";

function normalizeDraft(note) {
  return {
    title: note?.title || "",
    content: note?.content || "",
  };
}

function isSameDraft(a, b) {
  return a.title === b.title && a.content === b.content;
}

// PUBLIC_INTERFACE
export default function NoteEditor({
  note,
  mode, // "view" | "edit" | "create"
  isSaving,
  error,
  successMessage,
  onDirtyChange,
  onStartEdit,
  onCancel,
  onSave,
}) {
  /** Editor area for viewing, creating, and editing a note (with validation and UX feedback). */
  const initial = useMemo(() => normalizeDraft(note), [note]);
  const [draft, setDraft] = useState(initial);
  const [touched, setTouched] = useState({ title: false });

  const titleInputRef = useRef(null);

  useEffect(() => {
    setDraft(initial);
    setTouched({ title: false });
  }, [initial]);

  const dirty = !isSameDraft(draft, initial);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const titleError =
    touched.title && draft.title.trim().length === 0 ? "Title is required." : "";

  const canSave =
    (mode === "create" || mode === "edit") &&
    draft.title.trim().length > 0 &&
    !isSaving &&
    dirty;

  const titleLabel = mode === "create" ? "New note" : note?.title || "Untitled";

  useEffect(() => {
    if (mode === "create") {
      window.setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  }, [mode]);

  const handleSave = () => {
    // Ensure we show validation feedback.
    setTouched({ title: true });
    if (draft.title.trim().length === 0) {
      titleInputRef.current?.focus();
      return;
    }
    onSave(draft);
  };

  return (
    <section className="editor" aria-label="Note editor">
      <div className="editor-header">
        <div>
          <div className="editor-title">{titleLabel}</div>
          {mode !== "create" && note ? (
            <div className="editor-subtitle">
              Created {formatDateTime(note.created_at)} • Updated{" "}
              {formatDateTime(note.updated_at)}
            </div>
          ) : (
            <div className="editor-subtitle">Create a new note</div>
          )}
        </div>

        <div className="editor-actions">
          {mode === "view" ? (
            <button
              className="btn btn-secondary"
              onClick={() => {
                onStartEdit();
                window.setTimeout(() => titleInputRef.current?.focus(), 0);
              }}
              type="button"
              disabled={!note}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={onCancel}
                type="button"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                type="button"
                disabled={!canSave}
                aria-disabled={!canSave}
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="callout callout-error" role="alert">
          <div className="callout-title">Couldn’t save</div>
          <div className="callout-body">{error}</div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="callout callout-success" role="status" aria-live="polite">
          {successMessage}
        </div>
      ) : null}

      <div className="editor-body">
        <div className="field">
          <label className="field-label" htmlFor="note-title">
            Title <span className="sr-only">(required)</span>
          </label>
          <input
            id="note-title"
            ref={titleInputRef}
            className={`input ${titleError ? "input-error" : ""}`}
            value={draft.title}
            onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            onBlur={() => setTouched((p) => ({ ...p, title: true }))}
            placeholder="e.g. Meeting notes"
            disabled={mode === "view" || isSaving}
            aria-invalid={titleError ? "true" : "false"}
            aria-describedby={titleError ? "note-title-error" : undefined}
            onKeyDown={(e) => {
              // Ctrl/Cmd+Enter to save in edit/create mode
              if (
                (e.ctrlKey || e.metaKey) &&
                e.key === "Enter" &&
                (mode === "edit" || mode === "create")
              ) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          {titleError ? (
            <div className="field-error" id="note-title-error" role="alert">
              {titleError}
            </div>
          ) : (
            <div className="field-help">A short title helps you find it later.</div>
          )}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="note-content">
            Content
          </label>
          <textarea
            id="note-content"
            className="textarea"
            value={draft.content}
            onChange={(e) => setDraft((p) => ({ ...p, content: e.target.value }))}
            placeholder="Write your note…"
            rows={14}
            disabled={mode === "view" || isSaving}
          />
        </div>

        {(mode === "edit" || mode === "create") && !dirty ? (
          <div className="hint">Make a change to enable Save.</div>
        ) : null}
      </div>
    </section>
  );
}
