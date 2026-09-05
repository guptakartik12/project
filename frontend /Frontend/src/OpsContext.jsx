import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MOCK, allRoutes, pointOnPath, routeById } from "./mockData";

const OpsContext = createContext(null);

export function OpsProvider({ children, navigate }) {
  const [now, setNow] = useState(() => new Date());
  const [tick, setTick] = useState(0);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => new Set());
  const [selectedRouteId, setSelectedRouteId] = useState(MOCK.routes.recommended.id);
  const [destination, setDestination] = useState(MOCK.destination.name);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const [icebergQuery, setIcebergQuery] = useState("");
  const [icebergRisk, setIcebergRisk] = useState("all");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const sim = window.setInterval(() => {
      if (!paused) setTick((n) => n + 1);
    }, 400);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(sim);
    };
  }, [paused]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const weather = useMemo(() => {
    const w = MOCK.weather;
    const wind = Math.max(12, w.windSpeed + Math.sin(tick / 18) * 3.4);
    const temp = w.temperature + Math.sin(tick / 28) * 0.7;
    const vis = Math.max(4.5, w.visibility + Math.cos(tick / 22) * 0.6);
    const waves = Math.max(0.8, w.waveHeight + Math.sin(tick / 16) * 0.35);
    return {
      ...w,
      temperature: Number(temp.toFixed(1)),
      windSpeed: Number(wind.toFixed(1)),
      visibility: Number(vis.toFixed(1)),
      waveHeight: Number(waves.toFixed(1)),
    };
  }, [tick]);

  const icebergs = useMemo(() => {
    const drift = (tick % 300) / 300;
    return MOCK.icebergs.map((ib, idx) => {
      const t = (drift + idx * 0.22) % 1;
      const pos = pointOnPath(ib.trajectory, t);
      const dist = Number((ib.distanceKm - t * ib.driftKmh * 1.5).toFixed(1));
      return {
        ...ib,
        lat: pos.lat,
        lon: pos.lon,
        position: { lat: pos.lat, lon: pos.lon, x: pos.x, y: pos.y },
        distanceKm: Math.max(3.4, dist),
      };
    });
  }, [tick]);

  const selectedRoute = routeById(selectedRouteId);
  const vessel = useMemo(() => {
    // Vessel makes smooth simulated progress along the route towards Bharati Station
    const t = (tick % 360) / 360;
    const pos = pointOnPath(selectedRoute.path, t);
    const remainingKm = pos.remainingKm ?? (selectedRoute.distanceKm ? Math.round(selectedRoute.distanceKm * (1 - t)) : 280);
    const speed = Number((11.4 + Math.sin(tick / 14) * 0.8).toFixed(1));
    const speedKmh = speed * 1.852; // 1 knot = 1.852 km/h
    const etaHours = speedKmh > 0 ? remainingKm / speedKmh : 20;
    const h = Math.floor(etaHours);
    const m = Math.round((etaHours - h) * 60);
    const etaLabel = `${h}h ${m < 10 ? "0" : ""}${m}m`;

    return {
      ...MOCK.vessel,
      lat: pos.lat,
      lon: pos.lon,
      position: { lat: pos.lat, lon: pos.lon, x: pos.x, y: pos.y },
      heading: pos.heading,
      speed,
      progress: t,
      remainingKm,
      totalKm: pos.totalKm || selectedRoute.distanceKm,
      etaLabel,
      destinationName: "Bharati Research Station",
    };
  }, [tick, selectedRoute]);

  const unreadCount = MOCK.alerts.filter((a) => !readIds.has(a.id)).length;

  const openAlerts = useCallback(() => setAlertsOpen((v) => !v), []);
  const closeAlerts = useCallback(() => setAlertsOpen(false), []);

  const handleAlert = useCallback((alert) => {
    setReadIds((prev) => new Set(prev).add(alert.id));
    setAlertsOpen(false);
    if (alert.page && navigate) navigate(alert.page);
  }, [navigate]);

  const generateRoute = useCallback(async () => {
    setGenerating(true);
    await new Promise((r) => window.setTimeout(r, 1100));
    const pick = allRoutes()[Math.floor(Math.random() * 3)];
    setSelectedRouteId(pick.id);
    setGenerating(false);
    setToast(`Route ${pick.id} ready for ${destination}`);
  }, [destination, navigate]);

  const value = {
    now,
    weather,
    icebergs,
    vessel,
    selectedRouteId,
    setSelectedRouteId,
    selectedRoute,
    destination,
    setDestination,
    generating,
    generateRoute,
    toast,
    setToast,
    alerts: MOCK.alerts,
    unreadCount,
    alertsOpen,
    openAlerts,
    closeAlerts,
    handleAlert,
    readIds,
    icebergQuery,
    setIcebergQuery,
    icebergRisk,
    setIcebergRisk,
    paused,
    setPaused,
    navigate,
    lastUpdatedSec: (tick % 9) + 1,
  };

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export function useOps() {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error("useOps must be used inside OpsProvider");
  return ctx;
}
