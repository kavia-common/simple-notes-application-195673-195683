import React from "react";
import { formatDateTime } from "../utils/date";

// PUBLIC_INTERFACE
export default function NotesList({
  notes,
  selectedId,
  isLoading,
  error,
  onSelect,
  onCreateNew,
  onDelete,
}) {
  /** Sidebar list of notes with selection and delete actions. */
  return (
    <aside className="notes-sidebar" aria-label="Notes list">
      <div className="sidebar-header">
        <div className="sidebar-title">Notes</div>
        <button className="btn btn-primary btn-sm" onClick={onCreateNew} type="button">
          New
        </button>
      </div>

      {error ? (
        <div className="callout callout-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="notes-list" role="list">
        {isLoading ? (
          <div className="notes-empty">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="notes-empty">No notes yet. Create your first note.</div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              role="listitem"
              className={`note-row ${n.id === selectedId ? "is-selected" : ""}`}
            >
              <button
                type="button"
                className="note-row-main"
                onClick={() => onSelect(n.id)}
                aria-current={n.id === selectedId ? "true" : "false"}
              >
                <div className="note-row-title">{n.title || "Untitled"}</div>
                <div className="note-row-meta">
                  Updated {formatDateTime(n.updated_at)}
                </div>
              </button>

              <button
                type="button"
                className="icon-btn"
                aria-label={`Delete note: ${n.title || "Untitled"}`}
                onClick={() => onDelete(n)}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
