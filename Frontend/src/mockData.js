import { BHARATI } from "./sicMap";

export const MOCK = {
  station: {
    name: "Bharati Station",
    code: "BHA",
    position: { x: 46, y: 52 },
    lat: BHARATI.lat,
    lon: BHARATI.lon,
  },
  vessel: {
    name: "RV Sagar Nidhi",
    callsign: "ATJH",
    position: { x: 58, y: 38 },
    heading: 214,
    speed: 11.4,
    destinationName: "Research Zone Alpha",
  },
  destination: {
    name: "Research Zone Alpha",
    position: { x: 27, y: 66 },
  },
  destinations: [
    { name: "Research Zone Alpha", position: { x: 27, y: 66 } },
    { name: "Prydz Bay Survey", position: { x: 38, y: 48 } },
    { name: "Larsemann Hills", position: { x: 42, y: 70 } },
    { name: "Ice Edge Transect", position: { x: 62, y: 34 } },
  ],
  weather: {
    temperature: -18,
    temperatureTrend: "steady",
    windSpeed: 24,
    windDirection: "NE",
    windBearing: 45,
    visibility: 8.2,
    waveHeight: 2.1,
  },
  icebergs: [
    {
      id: "B-17",
      position: { x: 44, y: 44 },
      sizeLabel: "180 × 95 m",
      distanceKm: 12.4,
      driftKmh: 1.8,
      direction: "NE",
      directionBearing: 45,
      predicted6h: "+6.2 km / 6h",
      risk: "Moderate",
      page: "icebergs",
      trajectory: [
        { x: 44, y: 44 }, { x: 47, y: 40 }, { x: 51, y: 35 }, { x: 55, y: 30 },
      ],
    },
    {
      id: "B-21",
      position: { x: 66, y: 58 },
      sizeLabel: "120 × 80 m",
      distanceKm: 28.7,
      driftKmh: 1.2,
      direction: "E",
      directionBearing: 90,
      predicted6h: "+4.1 km / 6h",
      risk: "Low",
      page: "icebergs",
      trajectory: [
        { x: 66, y: 58 }, { x: 71, y: 58 }, { x: 76, y: 57 },
      ],
    },
    {
      id: "B-08",
      position: { x: 22, y: 30 },
      sizeLabel: "240 × 130 m",
      distanceKm: 41.2,
      driftKmh: 2.1,
      direction: "SE",
      directionBearing: 135,
      predicted6h: "+7.4 km / 6h",
      risk: "Low",
      page: "icebergs",
      trajectory: [
        { x: 22, y: 30 }, { x: 26, y: 34 }, { x: 30, y: 39 },
      ],
    },
    {
      id: "B-31",
      position: { x: 62, y: 22 },
      sizeLabel: "310 × 165 m",
      distanceKm: 56.4,
      driftKmh: 2.7,
      direction: "NE",
      directionBearing: 45,
      predicted6h: "+9.6 km / 6h",
      risk: "Moderate",
      page: "icebergs",
      trajectory: [
        { x: 62, y: 22 }, { x: 66, y: 17 }, { x: 71, y: 13 },
      ],
    },
  ],
  seaIceForecast: [
    { t: "Now", concentration: 64 },
    { t: "+6h", concentration: 61 },
    { t: "+12h", concentration: 58 },
    { t: "+24h", concentration: 54 },
    { t: "+48h", concentration: 57 },
    { t: "+72h", concentration: 62 },
  ],
  seaIceGrid: [
    [20, 28, 35, 40, 30, 18, 12, 10],
    [25, 38, 52, 58, 46, 28, 16, 10],
    [30, 48, 66, 72, 60, 40, 22, 14],
    [22, 40, 60, 70, 64, 44, 26, 16],
    [15, 28, 44, 54, 48, 32, 18, 10],
    [10, 18, 26, 34, 28, 16, 10, 8],
  ],
  riskZones: [
    { id: "rz-1", cx: 50, cy: 46, rx: 12, ry: 9, level: "High", rotate: -12 },
    { id: "rz-2", cx: 34, cy: 40, rx: 10, ry: 8, level: "Moderate", rotate: 10 },
    { id: "rz-3", cx: 70, cy: 30, rx: 9, ry: 7, level: "Moderate", rotate: -6 },
    { id: "rz-4", cx: 30, cy: 65, rx: 14, ry: 10, level: "Low", rotate: 4 },
  ],
  routes: {
    recommended: {
      id: "R-03",
      label: "AI Recommended",
      distanceKm: 412,
      etaLabel: "18h 42m",
      etaHours: 18.7,
      fuelL: 8420,
      risk: "Low",
      color: "#0f6e8c",
      path: [
        { x: 58, y: 38 }, { x: 52, y: 44 }, { x: 44, y: 50 },
        { x: 37, y: 58 }, { x: 27, y: 66 },
      ],
    },
    fastest: {
      id: "R-01",
      label: "Fastest",
      distanceKm: 386,
      etaLabel: "16h 15m",
      etaHours: 16.25,
      fuelL: 9210,
      risk: "Medium",
      color: "#9aa7b0",
      path: [
        { x: 58, y: 38 }, { x: 48, y: 42 }, { x: 40, y: 47 },
        { x: 33, y: 55 }, { x: 27, y: 66 },
      ],
    },
    safest: {
      id: "R-02",
      label: "Safest",
      distanceKm: 451,
      etaLabel: "21h 10m",
      etaHours: 21.17,
      fuelL: 8100,
      risk: "Very Low",
      color: "#bcd3dc",
      path: [
        { x: 58, y: 38 }, { x: 56, y: 48 }, { x: 48, y: 56 },
        { x: 38, y: 62 }, { x: 27, y: 66 },
      ],
    },
  },
  aiRecommendation: {
    routeId: "R-03",
    riskLevel: "Low",
    etaLabel: "18h 42m",
    fuelL: 8420,
    fuelSavingPct: 8.6,
    confidencePct: 91,
    explanation:
      "The recommended route avoids a high sea-ice concentration zone and remains outside the predicted drift corridor of Iceberg B-17 while maintaining favorable wind conditions.",
  },
  analytics: {
    fuelSavedPct: 8.6,
    distanceReductionPct: 9.2,
    riskReductionPct: 34,
    windTrend: [
      { t: "-18h", value: 19 }, { t: "-12h", value: 22 }, { t: "-6h", value: 20 },
      { t: "Now", value: 24 }, { t: "+6h", value: 27 }, { t: "+12h", value: 25 },
    ],
    tempTrend: [
      { t: "-18h", value: -16 }, { t: "-12h", value: -17 }, { t: "-6h", value: -17.5 },
      { t: "Now", value: -18 }, { t: "+6h", value: -19 }, { t: "+12h", value: -18.5 },
    ],
    icebergProximity: [
      { t: "-18h", value: 18.2 }, { t: "-12h", value: 16.0 }, { t: "-6h", value: 14.1 },
      { t: "Now", value: 12.4 }, { t: "+6h", value: 10.6 }, { t: "+12h", value: 9.1 },
    ],
    iceTrend: [
      { t: "-18h", value: 59 }, { t: "-12h", value: 61 }, { t: "-6h", value: 63 },
      { t: "Now", value: 64 }, { t: "+6h", value: 61 }, { t: "+12h", value: 58 },
    ],
  },
  alerts: [
    {
      id: "a1",
      type: "Iceberg Alert",
      severity: "moderate",
      message: "Iceberg B-17 predicted to enter a 15 km proximity zone in 6 hours.",
      time: "6 min ago",
      page: "icebergs",
    },
    {
      id: "a2",
      type: "Ice Alert",
      severity: "low",
      message: "Sea-ice concentration increasing along Route R-02.",
      time: "24 min ago",
      page: "iceForecast",
    },
    {
      id: "a3",
      type: "Weather Alert",
      severity: "moderate",
      message: "Wind conditions expected to deteriorate after 18:00.",
      time: "1 hr ago",
      page: "riskMap",
    },
  ],
  system: {
    status: "Operational",
    lastUpdated: "2 min ago",
    operator: { name: "Lt. Cdr. A. Rao", role: "Navigation Officer" },
  },
};

export function allRoutes() {
  return [MOCK.routes.recommended, MOCK.routes.fastest, MOCK.routes.safest];
}

export function routeById(id) {
  return allRoutes().find((r) => r.id === id) || MOCK.routes.recommended;
}

export function pointOnPath(path, t) {
  if (!path?.length) return { x: 0, y: 0, heading: 0 };
  if (path.length === 1) return { ...path[0], heading: 0 };
  const clamped = Math.min(0.999, Math.max(0, t));
  const segs = path.length - 1;
  const scaled = clamped * segs;
  const i = Math.min(segs - 1, Math.floor(scaled));
  const f = scaled - i;
  const a = path[i];
  const b = path[i + 1];
  const heading = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    heading,
  };
}
