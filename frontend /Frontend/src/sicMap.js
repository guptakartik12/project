/** Bharati Research Station (official coordinates). */
export const BHARATI = { lat: -69.4068, lon: 76.1953 };

/** AMSR2 model region from model_config.json */
export const REGION = {
  latMin: -70,
  latMax: -60,
  lonMin: 60,
  lonMax: 90,
};

export function pctToLatLon(x, y) {
  const lat = REGION.latMax - (y / 100) * (REGION.latMax - REGION.latMin);
  const lon = REGION.lonMin + (x / 100) * (REGION.lonMax - REGION.lonMin);
  return [lat, lon];
}

/** Standardises any coordinate format into [lat, lon]. */
export function toLatLng(p) {
  if (!p) return [0, 0];
  if (Array.isArray(p) && p.length >= 2) return [Number(p[0]), Number(p[1])];
  if (typeof p.lat === "number" && typeof p.lon === "number") return [p.lat, p.lon];
  if (typeof p.lat === "number" && typeof p.lng === "number") return [p.lat, p.lng];
  if (typeof p.x === "number" && typeof p.y === "number") {
    // If x/y looks like lat/lon already (Antarctica lat is negative 60-75)
    if (p.y < 0 && p.x > 0) return [p.y, p.x];
    return pctToLatLon(p.x, p.y);
  }
  return [0, 0];
}

/** Haversine formula for exact distance between two coordinates in km. */
export function haversineKm(coord1, coord2) {
  const [lat1, lon1] = toLatLng(coord1);
  const [lat2, lon2] = toLatLng(coord2);
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Computes initial compass bearing (0-360 degrees) from coord1 to coord2. */
export function calculateBearing(coord1, coord2) {
  const [lat1, lon1] = toLatLng(coord1);
  const [lat2, lon2] = toLatLng(coord2);
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const lambdaDiff = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(lambdaDiff) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambdaDiff);
  const theta = Math.atan2(y, x);
  return (theta * 180 / Math.PI + 360) % 360;
}

/** Total distance of a multi-point path in km. */
export function totalPathDistanceKm(path) {
  if (!path || path.length < 2) return 0;
  let dist = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    dist += haversineKm(path[i], path[i + 1]);
  }
  return dist;
}

/**
 * Interpolates an exact position and compass heading along a geographic path based on progress t (0 to 1).
 */
export function interpolateGeoPath(path, t) {
  if (!path || !path.length) {
    return { lat: BHARATI.lat, lon: BHARATI.lon, heading: 0, remainingKm: 0, totalKm: 0, progress: 0 };
  }
  if (path.length === 1) {
    const [lat, lon] = toLatLng(path[0]);
    return { lat, lon, heading: 0, remainingKm: 0, totalKm: 0, progress: 1 };
  }

  const clamped = Math.min(0.9999, Math.max(0, t));
  const segDistances = [];
  let totalKm = 0;

  for (let i = 0; i < path.length - 1; i += 1) {
    const d = haversineKm(path[i], path[i + 1]);
    segDistances.push(d);
    totalKm += d;
  }

  const targetDist = clamped * totalKm;
  let accumulated = 0;
  let activeIdx = 0;

  for (let i = 0; i < segDistances.length; i += 1) {
    if (accumulated + segDistances[i] >= targetDist || i === segDistances.length - 1) {
      activeIdx = i;
      break;
    }
    accumulated += segDistances[i];
  }

  const segLength = segDistances[activeIdx] || 0.0001;
  const segProgress = (targetDist - accumulated) / segLength;
  const [latA, lonA] = toLatLng(path[activeIdx]);
  const [latB, lonB] = toLatLng(path[activeIdx + 1]);

  const currentLat = latA + (latB - latA) * segProgress;
  const currentLon = lonA + (lonB - lonA) * segProgress;
  const heading = Math.round(calculateBearing([latA, lonA], [latB, lonB]));
  const remainingKm = Math.max(0, totalKm - targetDist);

  return {
    lat: currentLat,
    lon: currentLon,
    heading,
    remainingKm: Math.round(remainingKm * 10) / 10,
    totalKm: Math.round(totalKm * 10) / 10,
    progress: clamped,
  };
}

export function sic01(v) {
  if (v == null || Number.isNaN(Number(v))) return null;
  const n = Number(v);
  if (n > 1.5) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

/** Continuous colormap for SIC 0–1 (open water → packed ice). */
export function sicFill(v01) {
  const t = Math.max(0, Math.min(1, v01));
  const stops = [
    [0.0, [190, 225, 235], 0.08],
    [0.15, [168, 210, 224], 0.28],
    [0.35, [120, 186, 208], 0.48],
    [0.55, [62, 127, 156], 0.62],
    [0.75, [32, 84, 112], 0.78],
    [1.0, [14, 48, 68], 0.9],
  ];
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b[0] - a[0] || 1;
  const u = (t - a[0]) / span;
  const rgb = a[1].map((c, i) => Math.round(c + (b[1][i] - c) * u));
  const alpha = a[2] + (b[2] - a[2]) * u;
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})`;
}

export function iceRgb(vPct) {
  const t = vPct / 100;
  const stops = [
    [0, [220, 238, 243]],
    [0.45, [143, 193, 212]],
    [0.7, [62, 127, 156]],
    [1, [27, 74, 97]],
  ];
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const u = (t - a[0]) / ((b[0] - a[0]) || 1);
  return a[1].map((c, i) => Math.round(c + (b[1][i] - c) * u));
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
    modelInfo: raw.model_info || raw.config || null,
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

export function fieldBounds(field) {
  if (!field?.latitude || !field?.longitude) return null;
  let latMin = Infinity;
  let latMax = -Infinity;
  let lonMin = Infinity;
  let lonMax = -Infinity;
  const H = field.latitude.length;
  const W = field.latitude[0]?.length || 0;
  for (let i = 0; i < H; i += 1) {
    for (let j = 0; j < W; j += 1) {
      const lat = Number(field.latitude[i][j]);
      const lon = Number(field.longitude[i][j]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
      if (lon < lonMin) lonMin = lon;
      if (lon > lonMax) lonMax = lon;
    }
  }
  if (!Number.isFinite(latMin)) return null;
  return [[latMin, lonMin], [latMax, lonMax]];
}

function gridVal(grid, i, j) {
  const H = grid.length;
  const W = grid[0].length;
  const ii = Math.max(0, Math.min(H - 1, i));
  const jj = Math.max(0, Math.min(W - 1, j));
  return Number(grid[ii][jj]);
}

function cellCorners(latG, lonG, i, j) {
  const H = latG.length;
  const W = latG[0].length;
  const i1 = i + 1 <= H - 1 ? i + 1 : i - 1;
  const j1 = j + 1 <= W - 1 ? j + 1 : j - 1;
  const lat00 = gridVal(latG, i, j);
  const lon00 = gridVal(lonG, i, j);
  const lat01 = gridVal(latG, i, j1);
  const lon01 = gridVal(lonG, i, j1);
  const lat10 = gridVal(latG, i1, j);
  const lon10 = gridVal(lonG, i1, j);
  const lat11 = gridVal(latG, i1, j1);
  const lon11 = gridVal(lonG, i1, j1);
  const sJ = j1 < j ? -1 : 1;
  const sI = i1 < i ? -1 : 1;
  return [
    [lat00, lon00],
    [lat00 + sJ * (lat01 - lat00), lon00 + sJ * (lon01 - lon00)],
    [lat00 + sI * (lat10 - lat00) + sJ * (lat11 - lat00), lon00 + sI * (lon10 - lon00) + sJ * (lon11 - lon00)],
    [lat00 + sI * (lat10 - lat00), lon00 + sI * (lon10 - lon00)],
  ];
}

function toPx(lat, lon, latMin, latMax, lonMin, lonMax, w, h) {
  const x = ((lon - lonMin) / (lonMax - lonMin)) * (w - 1);
  const y = ((latMax - lat) / (latMax - latMin)) * (h - 1);
  return [x, y];
}

/**
 * Paint each AMSR2 cell as a lat/lon quad so the overlay sits on the real coastline.
 */
export function buildSicOverlay(field) {
  if (typeof document === "undefined" || !field?.prediction) return null;
  const { prediction, latitude, longitude, mask } = field;
  const H = prediction.length;
  const W = prediction[0]?.length || 0;
  if (!H || !W || !latitude || !longitude) return null;

  const bounds = fieldBounds(field);
  if (!bounds) return null;
  const [[latMin, lonMin], [latMax, lonMax]] = bounds;
  const lonSpan = lonMax - lonMin;
  const latSpan = latMax - latMin;
  if (lonSpan <= 0 || latSpan <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = Math.max(420, Math.round(1280 * (latSpan / lonSpan)));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < H; i += 1) {
    for (let j = 0; j < W; j += 1) {
      if (mask && mask[i] && mask[i][j] === false) continue;
      const v = sic01(prediction[i][j]);
      if (v == null) continue;
      const corners = cellCorners(latitude, longitude, i, j);
      if (corners.some((c) => !Number.isFinite(c[0]) || !Number.isFinite(c[1]))) continue;
      ctx.beginPath();
      corners.forEach((c, idx) => {
        const [x, y] = toPx(c[0], c[1], latMin, latMax, lonMin, lonMax, canvas.width, canvas.height);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = sicFill(v);
      ctx.fill();
    }
  }

  return {
    url: canvas.toDataURL("image/png"),
    bounds,
    shape: { height: H, width: W },
  };
}

export function nearestCell(field, lat, lon) {
  if (!field?.prediction || !field.latitude) return null;
  const H = field.prediction.length;
  const W = field.prediction[0].length;
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < H; i += 1) {
    for (let j = 0; j < W; j += 1) {
      if (field.mask && field.mask[i] && field.mask[i][j] === false) continue;
      const v = sic01(field.prediction[i][j]);
      if (v == null) continue;
      const la = Number(field.latitude[i][j]);
      const lo = Number(field.longitude[i][j]);
      if (!Number.isFinite(la) || !Number.isFinite(lo)) continue;
      const d = (la - lat) ** 2 + (lo - lon) ** 2;
      if (d < bestD) {
        bestD = d;
        best = { i, j, lat: la, lon: lo, sic: v };
      }
    }
  }
  if (!best || bestD > 0.85) return null;
  return best;
}

/** Local maxima in the CNN field — used as model-based high-ice risk markers. */
export function highIceHotspots(field, minSic = 0.72, limit = 18) {
  if (!field?.prediction) return [];
  const H = field.prediction.length;
  const W = field.prediction[0].length;
  const hits = [];
  for (let i = 1; i < H - 1; i += 1) {
    for (let j = 1; j < W - 1; j += 1) {
      if (field.mask && field.mask[i] && field.mask[i][j] === false) continue;
      const v = sic01(field.prediction[i][j]);
      if (v == null || v < minSic) continue;
      let maxN = v;
      for (let di = -1; di <= 1; di += 1) {
        for (let dj = -1; dj <= 1; dj += 1) {
          if (di === 0 && dj === 0) continue;
          const n = sic01(field.prediction[i + di][j + dj]);
          if (n != null && n > maxN) maxN = n;
        }
      }
      if (maxN > v) continue;
      hits.push({
        id: `sic-${i}-${j}`,
        lat: Number(field.latitude[i][j]),
        lon: Number(field.longitude[i][j]),
        sic: v,
        i,
        j,
      });
    }
  }
  hits.sort((a, b) => b.sic - a.sic);
  return hits.slice(0, limit);
}
