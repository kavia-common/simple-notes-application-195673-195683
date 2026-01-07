const DEFAULT_BASE_URL = "";

/**
 * Resolve backend API base URL from environment.
 * CRA only exposes env vars prefixed with REACT_APP_.
 */
function getApiBaseUrl() {
  const base =
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    DEFAULT_BASE_URL;

  // Normalize: remove trailing slash
  return (base || "").replace(/\/+$/, "");
}

async function parseErrorBody(response) {
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return typeof data?.detail === "string"
        ? data.detail
        : JSON.stringify(data);
    }
    return await response.text();
  } catch {
    return `HTTP ${response.status}`;
  }
}

// PUBLIC_INTERFACE
export async function listNotes({ signal } = {}) {
  /** Fetch all notes (sorted by backend by updated_at desc). */
  const url = `${getApiBaseUrl()}/notes`;
  const res = await fetch(url, { method: "GET", signal });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new Error(`Failed to load notes: ${msg}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }, { signal } = {}) {
  /** Create a new note. */
  const url = `${getApiBaseUrl()}/notes`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, content }),
    signal,
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new Error(`Failed to create note: ${msg}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function updateNote(id, { title, content }, { signal } = {}) {
  /** Update note by id (PUT with partial update semantics supported by backend). */
  const url = `${getApiBaseUrl()}/notes/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, content }),
    signal,
  });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new Error(`Failed to update note: ${msg}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function deleteNote(id, { signal } = {}) {
  /** Delete note by id. */
  const url = `${getApiBaseUrl()}/notes/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: "DELETE", signal });

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new Error(`Failed to delete note: ${msg}`);
  }
  return res.json();
}
