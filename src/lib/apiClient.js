// Thin fetch wrapper for the TaskControl JSON API (same-origin, cookie session).
export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const error = new Error((data && data.error) || `Erro (${res.status})`);
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}
