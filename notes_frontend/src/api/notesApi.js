const DEFAULT_BASE_URL = "http://localhost:3001";
const DEFAULT_TIMEOUT_MS = 12_000;

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
  return (base || "").replace(/\/*$/, "");
}

function isAbortError(err) {
  return (
    err &&
    typeof err === "object" &&
    // DOMException('AbortError') in browsers; name string in some environments.
    "name" in err &&
    err.name === "AbortError"
  );
}

function withTimeout(signal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const cleanup = () => window.clearTimeout(timeoutId);

  // If caller signal aborts, propagate.
  if (signal) {
    if (signal.aborted) controller.abort();
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return { signal: controller.signal, cleanup };
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

function normalizeFetchError(err, context) {
  if (isAbortError(err)) {
    return new Error(`${context}: request timed out. Please try again.`);
  }
  if (err instanceof TypeError) {
    // Common fetch network failure shape: "Failed to fetch"
    return new Error(`${context}: network error. Check connection and API URL.`);
  }
  return err instanceof Error ? err : new Error(`${context}: ${String(err)}`);
}

// PUBLIC_INTERFACE
export async function listNotes({ signal } = {}) {
  /** Fetch all notes (sorted by backend by updated_at desc). */
  const url = `${getApiBaseUrl()}/notes`;
  const { signal: mergedSignal, cleanup } = withTimeout(signal);

  try {
    const res = await fetch(url, { method: "GET", signal: mergedSignal });

    if (!res.ok) {
      const msg = await parseErrorBody(res);
      throw new Error(`Failed to load notes: ${msg}`);
    }
    return res.json();
  } catch (e) {
    throw normalizeFetchError(e, "Failed to load notes");
  } finally {
    cleanup();
  }
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }, { signal } = {}) {
  /** Create a new note. */
  const url = `${getApiBaseUrl()}/notes`;
  const { signal: mergedSignal, cleanup } = withTimeout(signal);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, content }),
      signal: mergedSignal,
    });

    if (!res.ok) {
      const msg = await parseErrorBody(res);
      throw new Error(`Failed to create note: ${msg}`);
    }
    return res.json();
  } catch (e) {
    throw normalizeFetchError(e, "Failed to create note");
  } finally {
    cleanup();
  }
}

// PUBLIC_INTERFACE
export async function updateNote(id, { title, content }, { signal } = {}) {
  /** Update note by id (PUT with partial update semantics supported by backend). */
  const url = `${getApiBaseUrl()}/notes/${encodeURIComponent(id)}`;
  const { signal: mergedSignal, cleanup } = withTimeout(signal);

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, content }),
      signal: mergedSignal,
    });

    if (!res.ok) {
      const msg = await parseErrorBody(res);
      throw new Error(`Failed to update note: ${msg}`);
    }
    return res.json();
  } catch (e) {
    throw normalizeFetchError(e, "Failed to update note");
  } finally {
    cleanup();
  }
}

// PUBLIC_INTERFACE
export async function deleteNote(id, { signal } = {}) {
  /** Delete note by id. */
  const url = `${getApiBaseUrl()}/notes/${encodeURIComponent(id)}`;
  const { signal: mergedSignal, cleanup } = withTimeout(signal);

  try {
    const res = await fetch(url, { method: "DELETE", signal: mergedSignal });

    if (!res.ok) {
      const msg = await parseErrorBody(res);
      throw new Error(`Failed to delete note: ${msg}`);
    }
    return res.json();
  } catch (e) {
    throw normalizeFetchError(e, "Failed to delete note");
  } finally {
    cleanup();
  }
}
