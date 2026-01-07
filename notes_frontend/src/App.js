import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import ConfirmDialog from "./components/ConfirmDialog";
import ToastCenter, { useToasts } from "./components/ToastCenter";
import { createNote, deleteNote, listNotes, updateNote } from "./api/notesApi";

function findSelected(notes, selectedId) {
  return notes.find((n) => n.id === selectedId) || null;
}

function confirmLoseChanges() {
  return window.confirm("You have unsaved changes. Discard them?");
}

// PUBLIC_INTERFACE
function App() {
  /** Notes frontend app: list notes, create/edit/delete, with a modern light theme and polished UX states. */
  const [theme, setTheme] = useState("light");

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // UI modes:
  // - "view": showing selected note in read-only
  // - "edit": editing existing note
  // - "create": creating new note
  const [mode, setMode] = useState("view");

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [isDirty, setIsDirty] = useState(false);

  const [confirmState, setConfirmState] = useState({
    open: false,
    note: null,
  });

  const { toasts, success, error, dismiss } = useToasts();

  const selectedNote = useMemo(
    () => findSelected(notes, selectedId),
    [notes, selectedId]
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Warn on browser tab close / refresh if there are unsaved changes.
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      // Chrome requires returnValue to be set.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await listNotes();
      setNotes(data);

      // Keep a sensible selection:
      // - preserve current selection if it still exists
      // - otherwise select first note
      setSelectedId((prevSelected) => {
        if (prevSelected && data.some((n) => n.id === prevSelected)) {
          return prevSelected;
        }
        return data.length > 0 ? data[0].id : null;
      });

      // If there are no notes, switch to create mode to guide the user.
      setMode((prevMode) => {
        if (data.length === 0) return "create";
        return prevMode === "create" ? "view" : prevMode;
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLoadError(message);
      error("Couldn’t load notes", message, {
        action: { label: "Retry", onClick: () => refresh() },
      });
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSelect = useCallback(
    (id) => {
      if ((mode === "edit" || mode === "create") && isDirty) {
        if (!confirmLoseChanges()) return;
      }
      setSelectedId(id);
      setMode("view");
      setSaveError("");
      setSaveSuccess("");
    },
    [isDirty, mode]
  );

  const handleCreateNew = useCallback(() => {
    if ((mode === "edit" || mode === "create") && isDirty) {
      if (!confirmLoseChanges()) return;
    }
    setSelectedId(null);
    setMode("create");
    setSaveError("");
    setSaveSuccess("");
  }, [isDirty, mode]);

  const handleStartEdit = useCallback(() => {
    if (!selectedNote) return;
    setMode("edit");
    setSaveError("");
    setSaveSuccess("");
  }, [selectedNote]);

  const handleCancel = useCallback(() => {
    if ((mode === "edit" || mode === "create") && isDirty) {
      const ok = confirmLoseChanges();
      if (!ok) return;
    }

    setSaveError("");
    setSaveSuccess("");
    if (notes.length === 0) {
      setMode("create");
      setSelectedId(null);
      return;
    }
    setMode("view");
  }, [isDirty, mode, notes.length]);

  const handleSave = useCallback(
    async ({ title, content }) => {
      setIsSaving(true);
      setSaveError("");
      setSaveSuccess("");

      try {
        if (mode === "create") {
          const created = await createNote({
            title: title.trim(),
            content,
          });

          // Backend sorts by updated_at desc; instead of guessing ordering, refresh.
          await refresh();
          setSelectedId(created.id);
          setMode("view");

          success("Saved", "Your note was created.");
          setSaveSuccess("Saved");
          window.setTimeout(() => setSaveSuccess(""), 1200);
        } else if (mode === "edit" && selectedNote) {
          await updateNote(selectedNote.id, {
            title: title.trim(),
            content,
          });

          await refresh();
          setMode("view");

          success("Saved", "Changes were saved.");
          setSaveSuccess("Saved");
          window.setTimeout(() => setSaveSuccess(""), 1200);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setSaveError(message);
        error("Save failed", message, {
          action: { label: "Retry", onClick: () => handleSave({ title, content }) },
        });
      } finally {
        setIsSaving(false);
      }
    },
    [error, mode, refresh, selectedNote, success]
  );

  const requestDelete = useCallback((note) => {
    setConfirmState({ open: true, note });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmState.note) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      await deleteNote(confirmState.note.id);
      setConfirmState({ open: false, note: null });

      await refresh();
      setMode((prevMode) => (prevMode === "edit" ? "view" : prevMode));

      success("Deleted", "Note removed.");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setSaveError(message);
      error("Delete failed", message, {
        action: {
          label: "Retry",
          onClick: () => confirmDelete(),
        },
      });
    } finally {
      setIsSaving(false);
    }
  }, [confirmDelete, confirmState.note, error, refresh, success]);

  const editorNote =
    mode === "create"
      ? { title: "", content: "", created_at: null, updated_at: null }
      : selectedNote;

  return (
    <div className="App">
      <ToastCenter toasts={toasts} onDismiss={dismiss} />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete note?"
        description={`This will permanently delete “${
          confirmState.note?.title || "Untitled"
        }”.`}
        confirmText="Delete"
        cancelText="Cancel"
        tone="danger"
        isBusy={isSaving}
        onCancel={() => setConfirmState({ open: false, note: null })}
        onConfirm={confirmDelete}
      />

      <div className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            N
          </div>
          <div className="brand-text">
            <div className="brand-title">Simple Notes</div>
            <div className="brand-subtitle">
              Create, edit, and organize your notes
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          type="button"
        >
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </div>

      <main className="shell">
        <NotesList
          notes={notes}
          selectedId={selectedId}
          isLoading={isLoading}
          error={loadError}
          onRetryLoad={refresh}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
          onDelete={requestDelete}
        />

        <div className="editor-wrap">
          <NoteEditor
            note={editorNote}
            mode={mode}
            isSaving={isSaving}
            error={saveError}
            successMessage={saveSuccess}
            onDirtyChange={setIsDirty}
            onStartEdit={handleStartEdit}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
