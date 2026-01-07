import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import { createNote, deleteNote, listNotes, updateNote } from "./api/notesApi";

function findSelected(notes, selectedId) {
  return notes.find((n) => n.id === selectedId) || null;
}

// PUBLIC_INTERFACE
function App() {
  /** Notes frontend app: list notes, create/edit/delete, with a modern light theme. */
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

  const selectedNote = useMemo(
    () => findSelected(notes, selectedId),
    [notes, selectedId]
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await listNotes({ signal: controller.signal });
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
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    setMode("view");
    setSaveError("");
  }, []);

  const handleCreateNew = useCallback(() => {
    setSelectedId(null);
    setMode("create");
    setSaveError("");
  }, []);

  const handleStartEdit = useCallback(() => {
    if (!selectedNote) return;
    setMode("edit");
    setSaveError("");
  }, [selectedNote]);

  const handleCancel = useCallback(() => {
    setSaveError("");
    if (notes.length === 0) {
      setMode("create");
      setSelectedId(null);
      return;
    }
    setMode("view");
  }, [notes.length]);

  const handleSave = useCallback(
    async ({ title, content }) => {
      setIsSaving(true);
      setSaveError("");

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
        } else if (mode === "edit" && selectedNote) {
          await updateNote(selectedNote.id, {
            title: title.trim(),
            content,
          });

          await refresh();
          setMode("view");
        }
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsSaving(false);
      }
    },
    [mode, refresh, selectedNote]
  );

  const handleDelete = useCallback(
    async (note) => {
      const ok = window.confirm(`Delete “${note.title || "Untitled"}”?`);
      if (!ok) return;

      setIsSaving(true);
      setSaveError("");

      try {
        await deleteNote(note.id);
        await refresh();

        // If we deleted the selected note, adjust mode/selection based on refresh() logic.
        setMode((prevMode) => (prevMode === "edit" ? "view" : prevMode));
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsSaving(false);
      }
    },
    [refresh]
  );

  const editorNote =
    mode === "create"
      ? { title: "", content: "", created_at: null, updated_at: null }
      : selectedNote;

  return (
    <div className="App">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            N
          </div>
          <div className="brand-text">
            <div className="brand-title">Simple Notes</div>
            <div className="brand-subtitle">Create, edit, and organize your notes</div>
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
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
          onDelete={handleDelete}
        />

        <div className="editor-wrap">
          <NoteEditor
            note={editorNote}
            mode={mode}
            isSaving={isSaving}
            error={saveError}
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
