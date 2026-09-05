import { BHARATI, toLatLng, interpolateGeoPath, haversineKm } from "./sicMap";

export const MOCK = {
  station: {
    name: "Bharati Research Station",
    code: "BHA",
    lat: BHARATI.lat,
    lon: BHARATI.lon,
    position: { lat: BHARATI.lat, lon: BHARATI.lon, x: 54, y: 94 },
    elevation: "35 m",
    location: "Larsemann Hills, Princess Elizabeth Land, Antarctica",
    coordinatesLabel: "69°24′24″S, 76°11′43″E",
    commissioned: "2012 (3rd Indian Antarctic Research Base)",
    winterCapacity: 47,
    vhfChannel: "Ch 16 / 12",
    status: "Active / Standby for Vessel Arrival",
  },
  vessel: {
    name: "RV Sagar Nidhi",
    callsign: "ATJH",
    mmsi: "419072300",
    imo: "9407550",
    type: "Ice-Class Oceanographic Research Vessel (MoES India)",
    lat: -65.25,
    lon: 75.60,
    position: { lat: -65.25, lon: 75.60, x: 52, y: 15 },
    heading: 182,
    speed: 11.4,
    destinationName: "Bharati Research Station",
  },
  destination: {
    name: "Bharati Research Station",
    lat: BHARATI.lat,
    lon: BHARATI.lon,
    position: { lat: BHARATI.lat, lon: BHARATI.lon, x: 54, y: 94 },
  },
  destinations: [
    { name: "Bharati Research Station", lat: BHARATI.lat, lon: BHARATI.lon, desc: "Main Base & Laboratories (Larsemann Hills)" },
    { name: "Bharati Ice Pier / Anchorage", lat: -69.3980, lon: 76.1850, desc: "Ship Offloading & Helicopter Deck Access" },
    { name: "Prydz Bay Deep Marine Station", lat: -67.2000, lon: 76.4500, desc: "Hydrographic Transect & CTD Profiling" },
    { name: "Larsemann Hills Coast Survey", lat: -69.3800, lon: 76.0500, desc: "Coastal Fast-Ice Edge Monitoring" },
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
      lat: -66.85,
      lon: 74.80,
      position: { lat: -66.85, lon: 74.80 },
      sizeLabel: "180 × 95 m",
      distanceKm: 18.2,
      driftKmh: 1.8,
      direction: "NE",
      directionBearing: 45,
      predicted6h: "+6.2 km / 6h",
      risk: "Moderate",
      page: "icebergs",
      trajectory: [
        [-66.85, 74.80],
        [-66.55, 75.10],
        [-66.20, 75.50],
        [-65.80, 76.00],
      ],
    },
    {
      id: "B-21",
      lat: -67.60,
      lon: 77.80,
      position: { lat: -67.60, lon: 77.80 },
      sizeLabel: "120 × 80 m",
      distanceKm: 28.7,
      driftKmh: 1.2,
      direction: "N",
      directionBearing: 0,
      predicted6h: "+4.1 km / 6h",
      risk: "Low",
      page: "icebergs",
      trajectory: [
        [-67.60, 77.80],
        [-67.25, 77.85],
        [-66.90, 77.90],
      ],
    },
    {
      id: "B-08",
      lat: -65.90,
      lon: 73.20,
      position: { lat: -65.90, lon: 73.20 },
      sizeLabel: "240 × 130 m",
      distanceKm: 41.2,
      driftKmh: 2.1,
      direction: "NE",
      directionBearing: 55,
      predicted6h: "+7.4 km / 6h",
      risk: "Low",
      page: "icebergs",
      trajectory: [
        [-65.90, 73.20],
        [-65.55, 73.60],
        [-65.20, 74.10],
      ],
    },
    {
      id: "B-31",
      lat: -68.30,
      lon: 74.90,
      position: { lat: -68.30, lon: 74.90 },
      sizeLabel: "310 × 165 m",
      distanceKm: 56.4,
      driftKmh: 2.7,
      direction: "NE",
      directionBearing: 40,
      predicted6h: "+9.6 km / 6h",
      risk: "Moderate",
      page: "icebergs",
      trajectory: [
        [-68.30, 74.90],
        [-67.90, 75.30],
        [-67.50, 75.80],
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
      distanceKm: 495,
      distanceNm: 267,
      etaLabel: "23h 30m",
      etaHours: 23.5,
      fuelL: 8420,
      risk: "Low",
      color: "#0f6e8c",
      description: "Navigates through low sea-ice concentration leads into Prydz Bay with safe clearance from iceberg drift corridors.",
      path: [
        [-65.25, 75.60],
        [-66.15, 75.90],
        [-67.20, 76.45],
        [-68.10, 76.20],
        [-68.85, 76.35],
        [-69.4068, 76.1953],
      ],
      waypoints: [
        { name: "Current Position (RV Sagar Nidhi)", lat: -65.25, lon: 75.60, type: "vessel" },
        { name: "WP-1 Ice Edge Lead", lat: -66.15, lon: 75.90, type: "waypoint" },
        { name: "WP-2 Prydz Channel Deep Water", lat: -67.20, lon: 76.45, type: "waypoint" },
        { name: "WP-3 Larsemann Approach", lat: -68.10, lon: 76.20, type: "waypoint" },
        { name: "WP-4 Quilty Bay Lead", lat: -68.85, lon: 76.35, type: "waypoint" },
        { name: "Destination (Bharati Research Station)", lat: -69.4068, lon: 76.1953, type: "station" },
      ],
    },
    fastest: {
      id: "R-01",
      label: "Fastest",
      distanceKm: 468,
      distanceNm: 253,
      etaLabel: "22h 10m",
      etaHours: 22.17,
      fuelL: 9210,
      risk: "Medium",
      color: "#9aa7b0",
      description: "Direct southern rhumb-line transit; crosses higher pack-ice concentration requiring active ice-breaking power.",
      path: [
        [-65.25, 75.60],
        [-66.30, 75.70],
        [-67.40, 75.90],
        [-68.50, 76.10],
        [-69.4068, 76.1953],
      ],
      waypoints: [
        { name: "Current Position (RV Sagar Nidhi)", lat: -65.25, lon: 75.60, type: "vessel" },
        { name: "WP-1 Direct Transit Alpha", lat: -66.30, lon: 75.70, type: "waypoint" },
        { name: "WP-2 Central Pack Ice Lead", lat: -67.40, lon: 75.90, type: "waypoint" },
        { name: "WP-3 Larsemann North", lat: -68.50, lon: 76.10, type: "waypoint" },
        { name: "Destination (Bharati Research Station)", lat: -69.4068, lon: 76.1953, type: "station" },
      ],
    },
    safest: {
      id: "R-02",
      label: "Safest",
      distanceKm: 538,
      distanceNm: 290,
      etaLabel: "25h 40m",
      etaHours: 25.67,
      fuelL: 8100,
      risk: "Very Low",
      color: "#4b93ac",
      description: "Wide eastern passage following low-ice coastal lead, circumventing all tracked iceberg clusters and heavy ridged ice.",
      path: [
        [-65.25, 75.60],
        [-65.90, 76.80],
        [-66.95, 77.40],
        [-67.90, 77.10],
        [-68.75, 76.60],
        [-69.4068, 76.1953],
      ],
      waypoints: [
        { name: "Current Position (RV Sagar Nidhi)", lat: -65.25, lon: 75.60, type: "vessel" },
        { name: "WP-1 Eastern Lead Entry", lat: -65.90, lon: 76.80, type: "waypoint" },
        { name: "WP-2 Open Water Corridor", lat: -66.95, lon: 77.40, type: "waypoint" },
        { name: "WP-3 Shelf Skirt Waypoint", lat: -67.90, lon: 77.10, type: "waypoint" },
        { name: "WP-4 Coastal Approach", lat: -68.75, lon: 76.60, type: "waypoint" },
        { name: "Destination (Bharati Research Station)", lat: -69.4068, lon: 76.1953, type: "station" },
      ],
    },
  },
  aiRecommendation: {
    routeId: "R-03",
    destinationName: "Bharati Research Station",
    riskLevel: "Low",
    etaLabel: "23h 30m",
    fuelL: 8420,
    fuelSavingPct: 8.6,
    confidencePct: 92,
    explanation:
      "The recommended route guides RV Sagar Nidhi through low sea-ice concentration channels in Prydz Bay directly to Bharati Research Station while maintaining a safe 18 km clearance from Iceberg B-17's predicted drift corridor.",
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
      { t: "-18h", value: 24.2 }, { t: "-12h", value: 21.0 }, { t: "-6h", value: 19.1 },
      { t: "Now", value: 18.2 }, { t: "+6h", value: 16.6 }, { t: "+12h", value: 15.1 },
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
      message: "Iceberg B-17 predicted drift corridor remains 18 km west of Route R-03 approach.",
      time: "6 min ago",
      page: "icebergs",
    },
    {
      id: "a2",
      type: "Ice Alert",
      severity: "low",
      message: "Sea-ice concentration increasing along fast Route R-01 (78% SIC in central sector).",
      time: "24 min ago",
      page: "iceForecast",
    },
    {
      id: "a3",
      type: "Weather Alert",
      severity: "moderate",
      message: "Wind gusts to 32 kt reported at Bharati Station meteorology mast.",
      time: "1 hr ago",
      page: "riskMap",
    },
  ],
  system: {
    status: "Operational",
    lastUpdated: "2 min ago",
    operator: { name: "Lt. Cdr. A. Rao", role: "Navigation Officer · MoES" },
  },
};

export function allRoutes() {
  return [MOCK.routes.recommended, MOCK.routes.fastest, MOCK.routes.safest];
}

export function routeById(id) {
  return allRoutes().find((r) => r.id === id) || MOCK.routes.recommended;
}

/** Interpolates ship or marker along any path (geographic [lat, lon] or legacy {x, y}). */
export function pointOnPath(path, t) {
  if (!path?.length) return { lat: BHARATI.lat, lon: BHARATI.lon, x: 0, y: 0, heading: 0 };
  if (path.length === 1) {
    const [lat, lon] = toLatLng(path[0]);
    return { lat, lon, x: lon, y: lat, heading: 0 };
  }

  // If path contains geographic coordinates (lat in [-90, 0] or array)
  const first = path[0];
  const isGeo = Array.isArray(first) || (typeof first === "object" && "lat" in first);

  if (isGeo) {
    const geo = interpolateGeoPath(path, t);
    return {
      lat: geo.lat,
      lon: geo.lon,
      heading: geo.heading,
      x: geo.lon,
      y: geo.lat,
      remainingKm: geo.remainingKm,
      totalKm: geo.totalKm,
      progress: geo.progress,
    };
  }

  // Fallback for legacy percentage paths
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
