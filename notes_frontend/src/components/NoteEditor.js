import React, { useEffect, useMemo, useState } from "react";
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
  onStartEdit,
  onCancel,
  onSave,
}) {
  /** Editor area for viewing, creating, and editing a note. */
  const initial = useMemo(() => normalizeDraft(note), [note]);
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const dirty = !isSameDraft(draft, initial);

  const canSave =
    (mode === "create" || mode === "edit") &&
    draft.title.trim().length > 0 &&
    !isSaving &&
    dirty;

  const titleLabel = mode === "create" ? "New Note" : note?.title || "Untitled";

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
            <button className="btn btn-secondary" onClick={onStartEdit} type="button" disabled={!note}>
              Edit
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onCancel} type="button" disabled={isSaving}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onSave(draft)}
                type="button"
                disabled={!canSave}
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="callout callout-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="editor-body">
        <label className="field">
          <span className="field-label">Title</span>
          <input
            className="input"
            value={draft.title}
            onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Meeting notes"
            disabled={mode === "view" || isSaving}
          />
        </label>

        <label className="field">
          <span className="field-label">Content</span>
          <textarea
            className="textarea"
            value={draft.content}
            onChange={(e) =>
              setDraft((p) => ({ ...p, content: e.target.value }))
            }
            placeholder="Write your note…"
            rows={14}
            disabled={mode === "view" || isSaving}
          />
        </label>

        {(mode === "edit" || mode === "create") && !dirty ? (
          <div className="hint">Make a change to enable Save.</div>
        ) : null}
        {(mode === "edit" || mode === "create") && draft.title.trim().length === 0 ? (
          <div className="hint hint-warn">Title is required.</div>
        ) : null}
      </div>
    </section>
  );
}
