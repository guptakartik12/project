/** Bharati Research Station (official coordinates). */
export const BHARATI = { lat: -69.4068, lon: 76.1953 };

/** AMSR2 model region from model_config.json */
export const REGION = {
  latMin: -70,
  latMax: -60,
  lonMin: 60,
  lonMax: 90,
};

const ICE_COLORS = {
  iceLow: [220, 238, 243],
  iceMod: [143, 193, 212],
  iceHigh: [62, 127, 156],
  iceVHigh: [27, 74, 97],
};

export function pctToLatLon(x, y) {
  const lat = REGION.latMax - (y / 100) * (REGION.latMax - REGION.latMin);
  const lon = REGION.lonMin + (x / 100) * (REGION.lonMax - REGION.lonMin);
  return [lat, lon];
}

export function iceRgb(vPct) {
  if (vPct < 20) return ICE_COLORS.iceLow;
  if (vPct < 45) return ICE_COLORS.iceMod;
  if (vPct < 70) return ICE_COLORS.iceHigh;
  return ICE_COLORS.iceVHigh;
}

export function iceCss(vPct) {
  const [r, g, b] = iceRgb(vPct);
  return `rgb(${r},${g},${b})`;
}

/** Collapse a 66×57 SIC field (0–1) into a coarse 0–100 grid. */
export function predictionToDisplayGrid(prediction, rows = 6, cols = 8) {
  if (!Array.isArray(prediction) || !prediction.length || !prediction[0]?.length) {
    return null;
  }
  const H = prediction.length;
  const W = prediction[0].length;
  const out = [];
  for (let r = 0; r < rows; r += 1) {
    const row = [];
    for (let c = 0; c < cols; c += 1) {
      const y = Math.min(H - 1, Math.floor(((r + 0.5) * H) / rows));
      const x = Math.min(W - 1, Math.floor(((c + 0.5) * W) / cols));
      const v = prediction[y][x];
      row.push(v == null || Number.isNaN(Number(v)) ? 0 : Math.round(Number(v) <= 1.5 ? Number(v) * 100 : Number(v)));
    }
    out.push(row);
  }
  return out;
}

export function normalizeSicPayload(raw) {
  if (!raw) return null;
  const prediction = raw.prediction || raw.sea_ice_concentration;
  const latitude = raw.latitude_grid || raw.latitude;
  const longitude = raw.longitude_grid || raw.longitude;
  if (!Array.isArray(prediction) || !prediction.length) return null;
  if (!Array.isArray(latitude) || !Array.isArray(longitude)) return null;
  return {
    prediction,
    latitude,
    longitude,
    mask: raw.mask || null,
    stats: raw.stats || computeStats(prediction),
    targetDate: raw.target_date || raw.prediction_date || null,
    inferenceTime: raw.inference_time_seconds ?? null,
    raw,
  };
}

export function computeStats(prediction) {
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let n = 0;
  let ice = 0;
  for (const row of prediction) {
    for (const v of row) {
      if (v == null || Number.isNaN(Number(v))) continue;
      const raw = Number(v);
      const x = raw > 1.5 ? raw / 100 : raw;
      sum += x;
      n += 1;
      if (x < min) min = x;
      if (x > max) max = x;
      if (x >= 0.15) ice += 1;
    }
  }
  if (!n) {
    return {
      mean_concentration: null,
      min_concentration: null,
      max_concentration: null,
      ice_coverage_fraction: null,
      valid_cells: 0,
    };
  }
  return {
    mean_concentration: sum / n,
    min_concentration: min,
    max_concentration: max,
    ice_coverage_fraction: ice / n,
    valid_cells: n,
  };
}

/**
 * Rasterize the 66×57 AMSR2 field into an equirectangular PNG for Leaflet ImageOverlay.
 */
export function buildSicOverlay(field) {
  if (typeof document === "undefined" || !field?.prediction) return null;
  const { prediction, latitude, longitude, mask } = field;
  const H = prediction.length;
  const W = prediction[0]?.length || 0;
  if (!H || !W) return null;

  let latMin = Infinity;
  let latMax = -Infinity;
  let lonMin = Infinity;
  let lonMax = -Infinity;

  for (let i = 0; i < H; i += 1) {
    for (let j = 0; j < W; j += 1) {
      const lat = latitude?.[i]?.[j];
      const lon = longitude?.[i]?.[j];
      if (lat == null || lon == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) continue;
      const la = Number(lat);
      const lo = Number(lon);
      if (la < latMin) latMin = la;
      if (la > latMax) latMax = la;
      if (lo < lonMin) lonMin = lo;
      if (lo > lonMax) lonMax = lo;
    }
  }

  if (!Number.isFinite(latMin) || latMax <= latMin || lonMax <= lonMin) {
    latMin = REGION.latMin;
    latMax = REGION.latMax;
    lonMin = REGION.lonMin;
    lonMax = REGION.lonMax;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const lonSpan = lonMax - lonMin;
  const latSpan = latMax - latMin;
  const cellW = Math.max(4, Math.ceil(canvas.width / W) + 2);
  const cellH = Math.max(4, Math.ceil(canvas.height / H) + 2);

  for (let i = 0; i < H; i += 1) {
    for (let j = 0; j < W; j += 1) {
      if (mask && mask[i] && mask[i][j] === false) continue;
      const v = prediction[i][j];
      if (v == null || Number.isNaN(Number(v))) continue;
      const lat = Number(latitude?.[i]?.[j]);
      const lon = Number(longitude?.[i]?.[j]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const x = ((lon - lonMin) / lonSpan) * (canvas.width - 1);
      const y = ((latMax - lat) / latSpan) * (canvas.height - 1);
      const pct = Number(v) <= 1.5 ? Number(v) * 100 : Number(v);
      const [r, g, b] = iceRgb(pct);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.28 + Math.min(0.55, pct / 180)})`;
      ctx.fillRect(x - cellW / 2, y - cellH / 2, cellW, cellH);
    }
  }

  return {
    url: canvas.toDataURL("image/png"),
    bounds: [
      [latMin, lonMin],
      [latMax, lonMax],
    ],
  };
}
