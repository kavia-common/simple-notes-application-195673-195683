import React from "react";
import { formatDateTime } from "../utils/date";

function NotesSkeleton() {
  return (
    <div className="notes-skeleton" aria-label="Loading notes">
      {Array.from({ length: 7 }).map((_, idx) => (
        <div key={idx} className="skeleton-row" aria-hidden="true">
          <div className="skeleton-line skeleton-line-1" />
          <div className="skeleton-line skeleton-line-2" />
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function NotesList({
  notes,
  selectedId,
  isLoading,
  error,
  onRetryLoad,
  onSelect,
  onCreateNew,
  onDelete,
}) {
  /** Sidebar list of notes with selection and delete actions. */
  return (
    <aside className="notes-sidebar" aria-label="Notes list">
      <div className="sidebar-header">
        <div className="sidebar-title">Notes</div>
        <button
          className="btn btn-primary btn-sm"
          onClick={onCreateNew}
          type="button"
          aria-label="Create a new note"
        >
          New note
        </button>
      </div>

      {error ? (
        <div className="callout callout-error" role="alert">
          <div className="callout-title">Couldn’t load notes</div>
          <div className="callout-body">{error}</div>
          {onRetryLoad ? (
            <div className="callout-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onRetryLoad}
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="notes-list" role="list">
        {isLoading ? (
          <NotesSkeleton />
        ) : notes.length === 0 ? (
          <div className="empty-panel" role="region" aria-label="Empty notes">
            <div className="empty-title">No notes yet</div>
            <div className="empty-body">
              Create your first note to get started. Add a title and start
              writing—everything saves to your notes list.
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onCreateNew}
            >
              New note
            </button>
          </div>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(n.id);
                  }
                }}
                aria-current={n.id === selectedId ? "true" : "false"}
                aria-label={`Open note: ${n.title || "Untitled"}`}
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
