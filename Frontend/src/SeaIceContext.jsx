import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, loadSampleSic } from "./api";
import { normalizeSicPayload, predictionToDisplayGrid } from "./sicMap";

const SeaIceContext = createContext(null);

export function SeaIceProvider({ children, fallbackGrid, fallbackSeries }) {
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [targetDate, setTargetDate] = useState("");
  const [forecast, setForecast] = useState(null);
  const [sicField, setSicField] = useState(null);
  const [displayGrid, setDisplayGrid] = useState(fallbackGrid);
  const [modelInfo, setModelInfo] = useState(null);

  const applyField = useCallback((raw) => {
    const field = normalizeSicPayload(raw);
    if (!field) return null;
    setSicField(field);
    const grid = predictionToDisplayGrid(field.prediction);
    if (grid) setDisplayGrid(grid);
    return field;
  }, []);

  const loadDemoField = useCallback(async () => {
    try {
      const sample = await loadSampleSic();
      applyField(sample);
    } catch {
      setDisplayGrid(fallbackGrid);
    }
  }, [applyField, fallbackGrid]);

  const runPredict = useCallback(async (date) => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.predict(date);
      const field = applyField(result);
      setForecast({
        ...result,
        stats: field?.stats || result.stats,
        inference_time_seconds: result.inference_time_seconds,
      });
      setStatus("live");
    } catch (err) {
      setError(err.message || "Prediction failed");
      setForecast(null);
      setStatus("mock");
      await loadDemoField();
    } finally {
      setLoading(false);
    }
  }, [applyField, loadDemoField]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadDemoField();
      try {
        const h = await api.health();
        if (cancelled) return;
        setHealth(h);
        try {
          const info = await api.modelInfo();
          if (!cancelled) setModelInfo(info.config || info);
        } catch {
          /* optional metadata */
        }
        if (h.ml_service !== "ok") {
          setStatus("mock");
          setError(h.ml_details?.error || "ML service unavailable — map shows the sample SIC field");
          return;
        }
        const dates = await api.availableDates();
        if (cancelled) return;
        const start = (dates.start || "").slice(0, 10);
        const end = (dates.end || "").slice(0, 10);
        setDateRange({ start, end });
        const initial = end || start;
        setTargetDate(initial);
        setStatus("live");
        if (initial) await runPredict(initial);
      } catch (err) {
        if (cancelled) return;
        setStatus("mock");
        setError(err.message || "API unreachable — map shows the sample SIC field");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDemoField, runPredict]);

  const series = useMemo(() => {
    const meanPct = forecast?.stats?.mean_concentration != null
      ? Math.round(forecast.stats.mean_concentration * 100)
      : sicField?.stats?.mean_concentration != null
        ? Math.round(sicField.stats.mean_concentration * 100)
        : null;
    if (meanPct == null) return fallbackSeries;
    const minPct = Math.round((forecast?.stats?.min_concentration ?? sicField?.stats?.min_concentration ?? 0) * 100);
    const maxPct = Math.round((forecast?.stats?.max_concentration ?? sicField?.stats?.max_concentration ?? 0) * 100);
    return [
      { t: "Min", concentration: minPct },
      { t: "Mean", concentration: meanPct },
      { t: "Max", concentration: maxPct },
    ];
  }, [forecast, sicField, fallbackSeries]);

  const value = {
    health,
    status,
    error,
    loading,
    dateRange,
    targetDate,
    setTargetDate: (date) => {
      setTargetDate(date);
      runPredict(date);
    },
    forecast,
    sicField,
    modelInfo,
    displayGrid,
    series,
    refresh: () => runPredict(targetDate),
  };

  return <SeaIceContext.Provider value={value}>{children}</SeaIceContext.Provider>;
}

export function useSeaIce() {
  const ctx = useContext(SeaIceContext);
  if (!ctx) throw new Error("useSeaIce must be used inside SeaIceProvider");
  return ctx;
}
