/** Same-origin `/api` in production; Vite proxies `/api` in development. */
const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

async function json(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  health: () => json("/api/health"),
  modelInfo: () => json("/api/model-info"),
  gridInfo: () => json("/api/grid-info"),
  availableDates: () => json("/api/available-dates"),
  predict: (target_date) =>
    json("/api/predict", {
      method: "POST",
      body: JSON.stringify({ target_date }),
    }),
};

export async function loadSampleSic() {
  const url = `${import.meta.env.BASE_URL}sample_sea_ice.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Sample sea-ice field missing");
  return res.json();
}
