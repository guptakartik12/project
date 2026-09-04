import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { SeaIceProvider, useSeaIce } from "./SeaIceContext";
import SeaIceMap from "./SeaIceMap";
import { MOCK } from "./mockData";
import { OpsProvider, useOps } from "./OpsContext";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Navigation2, Wind, Thermometer, Eye, Waves, AlertTriangle,
  ChevronRight, ChevronDown, Menu, X, Bell, Radio, User, Layers,
  Ship, Compass, TrendingDown, TrendingUp, Fuel, Clock,
  Shield, Target, CheckCircle2, Search, ChevronLeft, Pause, Play,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const COLORS = {
  bg: "#F5F9FA",
  bgAlt: "#EDF3F5",
  card: "#FFFFFF",
  border: "#DCE6EA",
  borderStrong: "#C4D3D9",
  navy: "#0D2B3E",
  navySoft: "#3D5A6C",
  sea: "#0F6E8C",
  seaLight: "#4B93AC",
  seaPale: "#BCD8E2",
  iceLow: "#DCEEF3",
  iceMod: "#8FC1D4",
  iceHigh: "#3E7F9C",
  iceVHigh: "#1B4A61",
  warn: "#B8895B",
  riskLow: "#9FC7D6",
  riskMod: "#4B7F98",
  riskHigh: "#8C6A4E",
  good: "#3E8E6F",
};

const RISK_COLOR = (level) => {
  const l = level.toLowerCase();
  if (l.includes("very low")) return COLORS.good;
  if (l.includes("low")) return COLORS.seaLight;
  if (l.includes("moderate") || l.includes("medium")) return COLORS.warn;
  if (l.includes("high")) return "#A8503B";
  return COLORS.navySoft;
};

/* ============================================================
   SMALL PRIMITIVES
   ============================================================ */

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "#EEF3F5", fg: COLORS.navySoft, bd: COLORS.border },
    good: { bg: "#E7F3EE", fg: "#2E6B52", bd: "#CBE4D8" },
    sea: { bg: "#E5F1F5", fg: COLORS.sea, bd: "#C8E0E8" },
    warn: { bg: "#F5EEE6", fg: "#8A5E38", bd: "#E6D3BF" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
        fontSize: 11, fontWeight: 600, letterSpacing: "0.01em",
        padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SystemStatusLabel() {
  const { status } = useSeaIce();
  const label = status === "live" ? "Live" : status === "connecting" ? "Connecting" : "Demo";
  return (
    <span style={{ fontSize: 11.5, color: COLORS.navySoft }}>
      System <b style={{ color: COLORS.navy }}>{label}</b>
    </span>
  );
}

function ApiSyncLabel() {
  const { status } = useSeaIce();
  const label = status === "live" ? "API live" : status === "connecting" ? "Connecting" : "Demo data";
  return <>{label}</>;
}

function Card({ children, style, title, action, padding = 16 }) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        boxShadow: "0 1px 2px rgba(13,43,62,0.04)",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: `14px ${padding}px 0`, marginBottom: 4,
          }}
        >
          <h3 style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.navy, margin: 0 }}>
            {title}
          </h3>
          {action}
        </div>
      )}
      <div style={{ padding: title ? `10px ${padding}px ${padding}px` : padding }}>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR
   ============================================================ */

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: Compass },
  { key: "iceForecast", label: "Ice Forecast", icon: Waves },
  { key: "icebergs", label: "Icebergs", icon: Target },
  { key: "riskMap", label: "Risk Map", icon: Shield },
  { key: "routePlanner", label: "Route Planner", icon: Navigation2 },
  { key: "analytics", label: "Analytics", icon: TrendingUp },
];

function Sidebar({ active, onNavigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { lastUpdatedSec } = useOps();
  const width = collapsed ? 68 : 224;

  const content = (
    <div
      style={{
        width, minWidth: width, height: "100%",
        background: COLORS.card, borderRight: `1px solid ${COLORS.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.18s ease",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: collapsed ? "18px 0" : "18px 18px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            width: 30, height: 30, borderRadius: 6, background: COLORS.sea,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Compass size={17} color="#fff" strokeWidth={2} />
        </div>
        {!collapsed && (
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy }}>ANI System</div>
            <div style={{ fontSize: 10.5, color: COLORS.navySoft }}>Bharati Ops</div>
          </div>
        )}
        <button
          onClick={onCloseMobile}
          className="ani-mobile-only"
          style={{
            marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
            padding: 4, color: COLORS.navySoft,
          }}
        >
          <X size={18} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 6, border: "none", cursor: "pointer",
                background: isActive ? COLORS.bgAlt : "transparent",
                color: isActive ? COLORS.sea : COLORS.navySoft,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                textAlign: "left", width: "100%",
                borderLeft: isActive ? `2px solid ${COLORS.sea}` : "2px solid transparent",
                transition: "background 0.12s ease",
              }}
              className="ani-nav-btn"
            >
              <Icon size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onToggleCollapse}
        className="ani-desktop-only"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, padding: "8px", margin: "0 10px 8px",
          background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6,
          color: COLORS.navySoft, cursor: "pointer", fontSize: 11.5,
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : (
          <>
            <ChevronLeft size={14} /> Collapse
          </>
        )}
      </button>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: collapsed ? "12px 8px" : "12px 16px" }}>
        {!collapsed ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: COLORS.good, flexShrink: 0 }} />
              <SystemStatusLabel />
            </div>
            <div style={{ fontSize: 11, color: COLORS.navySoft, marginBottom: 12 }}>
              Data updated {lastUpdatedSec}s ago
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: 99, background: COLORS.bgAlt,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <User size={14} color={COLORS.navySoft} />
              </div>
              <div style={{ lineHeight: 1.2, overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {MOCK.system.operator.name}
                </div>
                <div style={{ fontSize: 10.5, color: COLORS.navySoft }}>{MOCK.system.operator.role}</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: COLORS.good }} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="ani-desktop-only" style={{ height: "100%" }}>{content}</div>
      {mobileOpen && (
        <div
          className="ani-mobile-only"
          style={{
            position: "fixed", inset: 0, zIndex: 50, background: "rgba(13,43,62,0.35)",
            display: "flex",
          }}
          onClick={onCloseMobile}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ height: "100%" }}>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   HEADER
   ============================================================ */

function Header({ title, subtitle, onMenuClick }) {
  const {
    now, unreadCount, alertsOpen, openAlerts, closeAlerts, alerts, handleAlert, readIds,
    paused, setPaused,
  } = useOps();
  const panelRef = useRef(null);
  const timeStr = now.toLocaleString(undefined, {
    hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "short",
  });

  useEffect(() => {
    if (!alertsOpen) return undefined;
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) closeAlerts();
    };
    const onKey = (e) => {
      if (e.key === "Escape") closeAlerts();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [alertsOpen, closeAlerts]);

  return (
    <header
      className="ani-header"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: COLORS.card,
        borderBottom: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          className="ani-mobile-only ani-icon-btn"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1 className="ani-page-title" style={{ fontSize: 17, fontWeight: 700, color: COLORS.navy, margin: 0, letterSpacing: "-0.01em" }}>
            {title}
          </h1>
          <p className="ani-page-sub" style={{ fontSize: 12, color: COLORS.navySoft, margin: "1px 0 0" }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div className="ani-desktop-only" style={{ fontSize: 12, color: COLORS.navySoft, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {timeStr}
        </div>
        <div
          className="ani-desktop-only"
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12,
            color: COLORS.navySoft, borderLeft: `1px solid ${COLORS.border}`, paddingLeft: 12,
          }}
        >
          <Radio size={13} color={COLORS.good} />
          <ApiSyncLabel />
        </div>
        <button
          type="button"
          className="ani-icon-btn"
          title={paused ? "Resume live tracks" : "Pause live tracks"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
            color: COLORS.good, background: "#E7F3EE", border: "1px solid #CBE4D8",
            padding: "4px 10px", borderRadius: 5,
          }}
        >
          <span className={paused ? undefined : "ani-pulse"} style={{ width: 6, height: 6, borderRadius: 99, background: COLORS.good }} />
          <span className="ani-desktop-only">{paused ? "Paused" : "Live tracks"}</span>
        </div>
        <div ref={panelRef} style={{ position: "relative" }}>
          <button type="button" className="ani-icon-btn" aria-label="Alerts" onClick={openAlerts}>
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                className="ani-pulse"
                style={{
                  position: "absolute", top: 0, right: 0, minWidth: 14, height: 14,
                  borderRadius: 99, background: COLORS.warn, color: "#fff",
                  fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${COLORS.card}`, padding: "0 3px",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          {alertsOpen && (
            <div className="ani-alerts-panel">
              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12.5, fontWeight: 700, color: COLORS.navy }}>
                Alerts
              </div>
              {alerts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleAlert(a)}
                  style={{
                    display: "block", width: "100%", textAlign: "left", border: "none",
                    background: readIds.has(a.id) ? "#fff" : "#F5FAFB",
                    padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{a.type}</div>
                  <div style={{ fontSize: 12, color: COLORS.navySoft, marginTop: 2 }}>{a.message}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            width: 30, height: 30, borderRadius: 99, background: COLORS.bgAlt,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${COLORS.border}`, flexShrink: 0,
          }}
        >
          <User size={15} color={COLORS.navySoft} />
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   KPI CARDS
   ============================================================ */

function KPICard({ icon: Icon, label, value, sub, trend }) {
  return (
    <div
      style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8,
        padding: "13px 14px", boxShadow: "0 1px 2px rgba(13,43,62,0.04)",
        display: "flex", flexDirection: "column", gap: 6, minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.navySoft, fontSize: 11.5, fontWeight: 600 }}>
          <Icon size={14} strokeWidth={2} />
          {label}
        </div>
        {trend && (trend === "up" ? <TrendingUp size={13} color={COLORS.warn} /> : <TrendingDown size={13} color={COLORS.good} />)}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, letterSpacing: "-0.01em" }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 11.5, color: COLORS.navySoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sub}
        </span>
      </div>
    </div>
  );
}

function KPIRow() {
  const { sicField, forecast, status } = useSeaIce();
  const iceberg = MOCK.icebergs.slice().sort((a, b) => a.distanceKm - b.distanceKm)[0];
  const mean = forecast?.stats?.mean_concentration ?? sicField?.stats?.mean_concentration;
  const meanPct = mean != null ? `${Math.round(mean * 100)}%` : "—";
  const iceTone = mean == null ? "Moderate" : mean < 0.3 ? "Open water" : mean < 0.6 ? "Moderate" : "Packed";
  return (
    <div
      style={{
        display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 10,
      }}
      className="ani-kpi-grid"
    >
      <KPICard icon={Waves} label="Sea Ice" value={meanPct} sub={`${iceTone} · ${status === "live" ? "CNN grid" : "Sample grid"}`} />
      <KPICard icon={AlertTriangle} label="Iceberg Risk" value="LOW" sub={`Nearest: ${iceberg.distanceKm} km (${iceberg.id})`} />
      <KPICard icon={Thermometer} label="Weather" value="−18°C" sub={`Wind ${MOCK.weather.windSpeed} km/h ${MOCK.weather.windDirection}`} />
      <KPICard icon={Shield} label="Route Risk" value="18/100" sub="Low risk · Recommended route" />
      <KPICard icon={CheckCircle2} label="AI Confidence" value="91%" sub="Prediction confidence" />
    </div>
  );
}

/* ============================================================
   ANTARCTIC MAP
   ============================================================ */

const DEFAULT_LAYERS = {
  seaIce: true,
  icebergs: true,
  wind: false,
  temperature: false,
  riskZones: true,
  vessel: true,
  recommendedRoute: true,
  alternativeRoutes: false,
};

const LAYER_LABELS = {
  seaIce: "Sea-Ice Concentration",
  icebergs: "Iceberg Drift",
  wind: "Wind",
  temperature: "Temperature",
  riskZones: "Risk Zones",
  vessel: "Vessel",
  recommendedRoute: "Recommended Route",
  alternativeRoutes: "Alternative Routes",
};

function MapLayerControl({ layers, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1100 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.95)",
          border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "7px 10px",
          fontSize: 12, fontWeight: 600, color: COLORS.navy, cursor: "pointer",
          boxShadow: "0 1px 4px rgba(13,43,62,0.08)",
        }}
      >
        <Layers size={14} /> Layers <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div
          style={{
            marginTop: 6, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
            boxShadow: "0 4px 16px rgba(13,43,62,0.12)", padding: 8, minWidth: 200,
          }}
        >
          {Object.keys(layers).map((key) => (
            <label
              key={key}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 6px",
                fontSize: 12.5, color: COLORS.navy, cursor: "pointer", borderRadius: 5,
              }}
            >
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => onToggle(key)}
                style={{ accentColor: COLORS.sea, width: 14, height: 14 }}
              />
              {LAYER_LABELS[key]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SeaIceLegend() {
  return (
    <div
      style={{
        position: "absolute", bottom: 12, left: 12, background: "rgba(255,255,255,0.95)",
        border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "9px 11px",
        boxShadow: "0 1px 4px rgba(13,43,62,0.08)", zIndex: 1100,
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>
        Sea-Ice Concentration
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 10, color: COLORS.navySoft }}>0%</span>
        <div
          style={{
            width: 90, height: 8, borderRadius: 3,
            background: `linear-gradient(90deg, ${COLORS.iceLow}, ${COLORS.iceMod}, ${COLORS.iceHigh}, ${COLORS.iceVHigh})`,
            border: `1px solid ${COLORS.border}`,
          }}
        />
        <span style={{ fontSize: 10, color: COLORS.navySoft }}>100%</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: COLORS.navySoft, marginTop: 3 }}>
        <span>Low</span><span>High</span>
      </div>
    </div>
  );
}

function RouteLegend({ layers }) {
  const items = [];
  if (layers.recommendedRoute) items.push({ label: "AI Recommended", color: MOCK.routes.recommended.color, width: 3 });
  if (layers.alternativeRoutes) {
    items.push({ label: "Fastest", color: MOCK.routes.fastest.color, width: 1.6, dash: true });
    items.push({ label: "Safest", color: MOCK.routes.safest.color, width: 1.6, dash: true });
  }
  if (!items.length) return null;
  return (
    <div
      style={{
        position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.95)",
        border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: "8px 10px",
        boxShadow: "0 1px 4px rgba(13,43,62,0.08)", zIndex: 1100, fontSize: 11,
      }}
    >
      {items.map((it) => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <svg width="20" height="6">
            <line x1="0" y1="3" x2="20" y2="3" stroke={it.color} strokeWidth={it.width} strokeDasharray={it.dash ? "3,2" : undefined} />
          </svg>
          <span style={{ color: COLORS.navySoft }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function AntarcticMap({ layers, onToggleLayer, selectedIcebergId, onSelectIceberg, height = 480, showLegend = true }) {
  const { sicField, status } = useSeaIce();

  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: 8, overflow: "hidden", border: `1px solid ${COLORS.border}`, background: "#EAF3F6" }}>
      <SeaIceMap
        height={height}
        sicField={sicField}
        layers={layers}
        station={MOCK.station}
        vessel={MOCK.vessel}
        destination={MOCK.destination}
        icebergs={MOCK.icebergs}
        routes={MOCK.routes}
        riskZones={MOCK.riskZones}
        weather={MOCK.weather}
        selectedIcebergId={selectedIcebergId}
        onSelectIceberg={onSelectIceberg}
      />

      <div style={{ position: "absolute", top: 52, right: 12, zIndex: 1100, background: "rgba(255,255,255,0.95)", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 8px", fontSize: 11, color: COLORS.navySoft, maxWidth: 220 }}>
        {status === "live" ? "CNN 66×57 SIC grid · geographic" : "Sample SIC grid · geographic"}
      </div>

      <MapLayerControl layers={layers} onToggle={onToggleLayer} />
      {showLegend && layers.seaIce && <SeaIceLegend />}
      <RouteLegend layers={layers} />

      {selectedIcebergId && (() => {
        const ib = MOCK.icebergs.find((i) => i.id === selectedIcebergId);
        if (!ib) return null;
        return (
          <div
            style={{
              position: "absolute", left: 12, top: 56, background: "#fff",
              border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12,
              boxShadow: "0 6px 20px rgba(13,43,62,0.16)", width: 190, zIndex: 1100,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy }}>Iceberg {ib.id}</span>
              <button onClick={() => onSelectIceberg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.navySoft, padding: 2 }}>
                <X size={13} />
              </button>
            </div>
            <PopupRow label="Estimated Size" value={ib.sizeLabel} />
            <PopupRow label="Distance" value={`${ib.distanceKm} km`} />
            <PopupRow label="Drift Direction" value={ib.direction} />
            <PopupRow label="Predicted Movement" value={ib.predicted6h} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 11, color: COLORS.navySoft }}>Risk</span>
              <Badge tone={ib.risk === "Moderate" ? "warn" : "sea"}>{ib.risk}</Badge>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function PopupRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: COLORS.navySoft }}>{label}</span>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: COLORS.navy }}>{value}</span>
    </div>
  );
}

/* ============================================================
   WEATHER PANEL
   ============================================================ */

function WeatherPanel() {
  const w = MOCK.weather;
  const rows = [
    { icon: Thermometer, label: "Temperature", value: `${w.temperature}°C` },
    { icon: Wind, label: "Wind Speed", value: `${w.windSpeed} km/h` },
    { icon: Compass, label: "Wind Direction", value: w.windDirection },
    { icon: Eye, label: "Visibility", value: `${w.visibility} km` },
    { icon: Waves, label: "Wave Height", value: `${w.waveHeight} m` },
  ];
  return (
    <Card title="Environmental Conditions">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.navySoft, fontSize: 12.5 }}>
              <r.icon size={14} strokeWidth={2} />
              {r.label}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy }}>{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
   AI RECOMMENDATION PANEL
   ============================================================ */

function AIRecommendationPanel() {
  const rec = MOCK.aiRecommendation;
  return (
    <Card
      style={{ borderColor: COLORS.seaPale, background: "linear-gradient(180deg, #F5FAFB 0%, #FFFFFF 55%)" }}
      title="AI Navigation Recommendation"
      action={<Badge tone="sea">Route {rec.routeId}</Badge>}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 }}>
        <MiniStat icon={Shield} label="Risk Level" value={rec.riskLevel} tone={RISK_COLOR(rec.riskLevel)} />
        <MiniStat icon={Clock} label="Estimated ETA" value={rec.etaLabel} />
        <MiniStat icon={Fuel} label="Estimated Fuel" value={`${rec.fuelL.toLocaleString()} L`} />
        <MiniStat icon={TrendingDown} label="Fuel Saving" value={`${rec.fuelSavingPct}%`} tone={COLORS.good} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11.5, color: COLORS.navySoft }}>AI Confidence</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.sea }}>{rec.confidencePct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: COLORS.bgAlt, overflow: "hidden" }}>
          <div style={{ width: `${rec.confidencePct}%`, height: "100%", background: COLORS.sea, borderRadius: 99 }} />
        </div>
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: COLORS.navySoft, margin: 0, borderTop: `1px solid ${COLORS.border}`, paddingTop: 10 }}>
        {rec.explanation}
      </p>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, tone }) {
  return (
    <div style={{ background: COLORS.bgAlt, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.navySoft, fontSize: 10.5, fontWeight: 600, marginBottom: 3 }}>
        <Icon size={11.5} /> {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: tone || COLORS.navy }}>{value}</div>
    </div>
  );
}

/* ============================================================
   ROUTE COMPARISON TABLE
   ============================================================ */

function RouteComparisonTable({ selectedRouteId, onSelectRoute }) {
  const routes = [MOCK.routes.recommended, MOCK.routes.fastest, MOCK.routes.safest];
  return (
    <Card title="Route Recommendation" padding={0}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {["Route", "Distance", "ETA", "Fuel", "Risk"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i === 0 ? "left" : "right", padding: "10px 16px",
                    fontSize: 10.5, fontWeight: 700, color: COLORS.navySoft,
                    textTransform: "uppercase", letterSpacing: "0.03em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => {
              const isRec = r.label === "AI Recommended";
              const isSel = selectedRouteId === r.id;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRoute && onSelectRoute(r.id)}
                  style={{
                    borderBottom: `1px solid ${COLORS.border}`,
                    background: isSel ? "#EAF4F7" : isRec ? "#F5FAFB" : "transparent",
                    cursor: onSelectRoute ? "pointer" : "default",
                  }}
                >
                  <td style={{ padding: "11px 16px", fontWeight: isRec ? 700 : 500, color: COLORS.navy }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                      {r.label}
                    </div>
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right", color: COLORS.navySoft }}>{r.distanceKm} km</td>
                  <td style={{ padding: "11px 16px", textAlign: "right", color: COLORS.navySoft }}>{r.etaLabel}</td>
                  <td style={{ padding: "11px 16px", textAlign: "right", color: COLORS.navySoft }}>{r.fuelL.toLocaleString()} L</td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }}>
                    <Badge tone={r.risk.toLowerCase().includes("low") ? (isRec ? "sea" : "good") : "warn"}>{r.risk}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "10px 16px", fontSize: 11.5, color: COLORS.navySoft, borderTop: `1px solid ${COLORS.border}` }}>
        The AI route may not be the shortest, but offers the best balance of safety, fuel and time.
      </div>
    </Card>
  );
}

/* ============================================================
   ALERT PANEL
   ============================================================ */

function AlertPanel() {
  return (
    <Card title="Active Alerts">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MOCK.alerts.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex", gap: 9, padding: "9px 10px", borderRadius: 6,
              background: COLORS.bgAlt, border: `1px solid ${COLORS.border}`,
            }}
          >
            <AlertTriangle
              size={15} style={{ flexShrink: 0, marginTop: 1 }}
              color={a.severity === "moderate" ? COLORS.warn : COLORS.seaLight}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{a.type}</span>
                <span style={{ fontSize: 10.5, color: COLORS.navySoft }}>· {a.time}</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.navySoft, lineHeight: 1.4 }}>{a.message}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ============================================================
   PAGE: OVERVIEW
   ============================================================ */

function OverviewPage() {
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [selectedIceberg, setSelectedIceberg] = useState(null);
  const toggleLayer = (key) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIRow />
      <div className="ani-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 14, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="Antarctic Navigation Map" action={<Badge tone="sea">Bharati region · 66×57 SIC</Badge>} padding={12}>
            <AntarcticMap
              layers={layers} onToggleLayer={toggleLayer}
              selectedIcebergId={selectedIceberg} onSelectIceberg={setSelectedIceberg}
              height={440}
            />
          </Card>
          <RouteComparisonTable />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <AIRecommendationPanel />
          <WeatherPanel />
          <AlertPanel />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: ICE FORECAST
   ============================================================ */

function IceForecastPage() {
  const { series, forecast, sicField, status, error, loading, targetDate, setTargetDate, dateRange, refresh } = useSeaIce();
  const data = series;
  const meanVal = forecast?.stats?.mean_concentration ?? sicField?.stats?.mean_concentration;
  const meanPct = meanVal != null ? `${Math.round(meanVal * 100)}%` : "—";
  const covVal = forecast?.stats?.ice_coverage_fraction ?? sicField?.stats?.ice_coverage_fraction;
  const coverage = covVal != null ? `${Math.round(covVal * 100)}%` : "—";
  const badge = status === "live" ? "CNN live" : loading ? "Loading" : "Demo";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ani-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 14, alignItems: "start" }}>
        <Card
          title="Sea-Ice Concentration Forecast"
          action={<Badge tone={status === "live" ? "sea" : "warn"}>{badge}</Badge>}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, color: COLORS.navySoft }}>
              Target date{" "}
              <input
                type="date"
                value={targetDate || ""}
                min={dateRange.start || undefined}
                max={dateRange.end || undefined}
                onChange={(e) => setTargetDate(e.target.value)}
                style={{
                  marginLeft: 6, padding: "4px 8px", borderRadius: 5,
                  border: `1px solid ${COLORS.border}`, fontSize: 12, color: COLORS.navy,
                }}
              />
            </label>
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              style={{
                padding: "4px 10px", borderRadius: 5, border: `1px solid ${COLORS.border}`,
                background: COLORS.card, color: COLORS.sea, fontSize: 12, cursor: "pointer", fontWeight: 600,
              }}
            >
              {loading ? "Running…" : "Run forecast"}
            </button>
          </div>
          {error && (
            <p style={{ fontSize: 12, color: COLORS.warn, margin: "0 0 8px" }}>{error}</p>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="iceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.sea} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={COLORS.sea} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 11, fill: COLORS.navySoft }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.navySoft }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: `1px solid ${COLORS.border}` }} />
              <Area type="monotone" dataKey="concentration" stroke={COLORS.sea} strokeWidth={2} fill="url(#iceFill)" name="Concentration" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Forecast Summary">
            <StatLine label="Mean concentration" value={meanPct} />
            <StatLine label="Ice coverage" value={coverage} />
            <StatLine label="Inference" value={forecast?.inference_time_seconds != null ? `${forecast.inference_time_seconds}s` : "—"} />
            <StatLine
              label="Source"
              value={status === "live" ? "Seasonal CNN" : "Mock"}
              tone={status === "live" ? COLORS.good : COLORS.warn}
            />
          </Card>
          <Card style={{ background: COLORS.bgAlt }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>Model note</div>
            <p style={{ fontSize: 12.5, color: COLORS.navySoft, lineHeight: 1.5, margin: 0 }}>
              The CNN forecasts sea-ice concentration on the Bharati AMSR2 66×57 lat/lon grid.
              That field is drawn on the real map (Prydz Bay / Princess Elizabeth Land). Iceberg tracks remain demo layers.
            </p>
          </Card>
        </div>
      </div>
      <Card title="Regional Sea-Ice Map" padding={12}>
        <AntarcticMap
          layers={{ ...DEFAULT_LAYERS, riskZones: false, alternativeRoutes: false, recommendedRoute: false }}
          onToggleLayer={() => {}}
          selectedIcebergId={null} onSelectIceberg={() => {}}
          height={340}
        />
      </Card>
    </div>
  );
}

function StatLine({ label, value, icon: Icon, tone }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ fontSize: 12.5, color: COLORS.navySoft }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: tone || COLORS.navy }}>
        {Icon && <Icon size={13} />} {value}
      </span>
    </div>
  );
}

/* ============================================================
   PAGE: ICEBERGS
   ============================================================ */

function IcebergsPage() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="ani-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 14, alignItems: "start" }}>
      <Card title="Tracked Icebergs" padding={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                {["ID", "Distance", "Size", "Drift", "Direction", "Risk"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "10px 16px", fontSize: 10.5, fontWeight: 700, color: COLORS.navySoft, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK.icebergs.map((ib) => (
                <tr
                  key={ib.id}
                  onClick={() => setSelected(ib.id === selected ? null : ib.id)}
                  style={{ borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer", background: selected === ib.id ? "#EAF4F7" : "transparent" }}
                >
                  <td style={{ padding: "11px 16px", fontWeight: 700, color: COLORS.navy }}>{ib.id}</td>
                  <td style={{ padding: "11px 16px", textAlign: "right", color: COLORS.navySoft }}>{ib.distanceKm} km</td>
                  <td style={{ padding: "11px 16px", textAlign: "right", color: COLORS.navySoft }}>{ib.sizeLabel}</td>
                  <td style={{ padding: "11px 16px", textAlign: "right", color: COLORS.navySoft }}>{ib.driftKmh} km/h</td>
                  <td style={{ padding: "11px 16px", textAlign: "right", color: COLORS.navySoft }}>{ib.direction}</td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }}>
                    <Badge tone={ib.risk === "Moderate" ? "warn" : "sea"}>{ib.risk}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {selected ? (() => {
          const ib = MOCK.icebergs.find((i) => i.id === selected);
          return (
            <Card title={`Iceberg ${ib.id}`} action={<Badge tone={ib.risk === "Moderate" ? "warn" : "sea"}>{ib.risk}</Badge>}>
              <StatLine label="Estimated Size" value={ib.sizeLabel} />
              <StatLine label="Distance" value={`${ib.distanceKm} km`} />
              <StatLine label="Drift Speed" value={`${ib.driftKmh} km/h`} />
              <StatLine label="Drift Direction" value={ib.direction} />
              <StatLine label="Predicted Movement" value={ib.predicted6h} />
            </Card>
          );
        })() : (
          <Card style={{ background: COLORS.bgAlt }}>
            <p style={{ fontSize: 12.5, color: COLORS.navySoft, margin: 0 }}>Select an iceberg to view detailed tracking information.</p>
          </Card>
        )}
        <Card title="Iceberg Map" padding={12}>
          <AntarcticMap
            layers={{ ...DEFAULT_LAYERS, riskZones: false, recommendedRoute: false }}
            onToggleLayer={() => {}}
            selectedIcebergId={selected} onSelectIceberg={setSelected}
            height={260} showLegend={false}
          />
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: RISK MAP
   ============================================================ */

function RiskMapPage() {
  const [layers, setLayers] = useState({ ...DEFAULT_LAYERS, alternativeRoutes: false, recommendedRoute: false });
  const toggleLayer = (key) => setLayers((l) => ({ ...l, [key]: !l[key] }));
  return (
    <div className="ani-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 14, alignItems: "start" }}>
      <Card title="Antarctic Risk Map" padding={12}>
        <AntarcticMap
          layers={layers} onToggleLayer={toggleLayer}
          selectedIcebergId={null} onSelectIceberg={() => {}}
          height={520}
        />
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card style={{ textAlign: "center", background: "linear-gradient(180deg,#F5FAFB,white)" }}>
          <div style={{ fontSize: 11.5, color: COLORS.navySoft, fontWeight: 600, marginBottom: 6 }}>Overall Navigation Risk</div>
          <div style={{ fontSize: 38, fontWeight: 800, color: COLORS.sea, lineHeight: 1 }}>18</div>
          <div style={{ fontSize: 12, color: COLORS.navySoft, marginBottom: 8 }}>out of 100</div>
          <Badge tone="sea">LOW</Badge>
        </Card>
        <Card title="Risk Composition">
          <StatLine label="Sea-Ice Contribution" value="6 / 40" />
          <StatLine label="Iceberg Contribution" value="5 / 30" />
          <StatLine label="Wind Contribution" value="4 / 15" />
          <StatLine label="Temperature Contribution" value="3 / 15" />
        </Card>
        <Card style={{ background: COLORS.bgAlt }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>AI Risk Assessment</div>
          <p style={{ fontSize: 12.5, color: COLORS.navySoft, lineHeight: 1.5, margin: 0 }}>
            Combined risk remains low across the current transit corridor. The primary contributor is
            moderate sea-ice concentration west of Bharati Station; wind and temperature remain within
            favorable operating thresholds.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: ROUTE PLANNER
   ============================================================ */

function RoutePlannerPage() {
  const [destination, setDestination] = useState(MOCK.destination.name);
  const [generated, setGenerated] = useState(true);
  const [layers, setLayers] = useState({ ...DEFAULT_LAYERS, alternativeRoutes: true });
  const [selectedRoute, setSelectedRoute] = useState(MOCK.routes.recommended.id);
  const toggleLayer = (key) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  const handleGenerate = useCallback(() => {
    setGenerated(true);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ani-main-grid" style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 14, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Plan Safe Route">
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.navySoft, display: "block", marginBottom: 4 }}>
                Current Location
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", background: COLORS.bgAlt, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontSize: 12.5, color: COLORS.navy, fontWeight: 600 }}>
                <Ship size={14} color={COLORS.sea} /> {MOCK.vessel.name}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.navySoft, display: "block", marginBottom: 4 }}>
                Destination
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", background: "#fff", borderRadius: 6, border: `1px solid ${COLORS.borderStrong}` }}>
                <Search size={14} color={COLORS.navySoft} />
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Search destination..."
                  style={{ border: "none", outline: "none", fontSize: 12.5, color: COLORS.navy, width: "100%", background: "transparent" }}
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              style={{
                width: "100%", padding: "10px 14px", background: COLORS.sea, color: "#fff",
                border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
            >
              <Navigation2 size={15} /> Generate Optimal Route
            </button>
          </Card>

          {generated && <AIRecommendationPanel />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="Route Map" action={<Badge tone="sea">3 options</Badge>} padding={12}>
            <AntarcticMap
              layers={layers} onToggleLayer={toggleLayer}
              selectedIcebergId={null} onSelectIceberg={() => {}}
              height={420}
            />
          </Card>
          {generated && <RouteComparisonTable selectedRouteId={selectedRoute} onSelectRoute={setSelectedRoute} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: ANALYTICS
   ============================================================ */

function MiniChartCard({ title, data, unit, color }) {
  return (
    <Card title={title}>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="t" tick={{ fontSize: 10, fill: COLORS.navySoft }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: COLORS.navySoft }} axisLine={false} tickLine={false} unit={unit} width={34} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: `1px solid ${COLORS.border}` }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2.5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function AnalyticsPage() {
  const a = MOCK.analytics;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ani-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
        <KPICard icon={Fuel} label="Fuel Saved" value={`${a.fuelSavedPct}%`} sub="Vs. fastest route baseline" />
        <KPICard icon={Navigation2} label="Distance Reduction" value={`${a.distanceReductionPct}%`} sub="Optimized route planning" />
        <KPICard icon={Shield} label="Risk Reduction" value={`${a.riskReductionPct}%`} sub="Vs. unassisted routing" />
      </div>
      <div className="ani-analytics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 14 }}>
        <MiniChartCard title="Sea-Ice Concentration" data={a.iceTrend} unit="%" color={COLORS.sea} />
        <MiniChartCard title="Wind Speed" data={a.windTrend} unit=" km/h" color={COLORS.seaLight} />
        <MiniChartCard title="Temperature" data={a.tempTrend} unit="°C" color={COLORS.navySoft} />
        <MiniChartCard title="Iceberg Proximity" data={a.icebergProximity} unit=" km" color={COLORS.warn} />
      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */

const PAGE_META = {
  overview: { component: OverviewPage, title: "Antarctic Navigation Intelligence", subtitle: "AI Decision Support System · Bharati Station Operations" },
  iceForecast: { component: IceForecastPage, title: "Ice Forecast", subtitle: "1-day sea-ice concentration CNN · Bharati grid" },
  icebergs: { component: IcebergsPage, title: "Icebergs", subtitle: "Tracked iceberg positions and drift prediction" },
  riskMap: { component: RiskMapPage, title: "Risk Map", subtitle: "Combined environmental hazard assessment" },
  routePlanner: { component: RoutePlannerPage, title: "Route Planner", subtitle: "AI-assisted route generation and comparison" },
  analytics: { component: AnalyticsPage, title: "Analytics", subtitle: "Route efficiency and environmental trends" },
};

export default function Dashboard() {
  return (
    <SeaIceProvider fallbackGrid={MOCK.seaIceGrid} fallbackSeries={MOCK.seaIceForecast}>
      <DashboardWithOps />
    </SeaIceProvider>
  );
}

function DashboardWithOps() {
  const [active, setActive] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (key) => {
    setActive(key);
    setMobileOpen(false);
  };

  return (
    <OpsProvider navigate={handleNavigate}>
      <DashboardShell
        active={active}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onNavigate={handleNavigate}
      />
    </OpsProvider>
  );
}

function DashboardShell({ active, mobileOpen, setMobileOpen, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const { toast, setToast } = useOps();

  const meta = PAGE_META[active];
  const Page = meta.component;

  const handleNavigate = (key) => {
    onNavigate(key);
  };

  return (
    <div
      className="ani-app-root"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        width: "100%",
        minWidth: "100%",
        height: "100vh",
        minHeight: "100vh",
        maxWidth: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        background: COLORS.bg,
        color: COLORS.navy,
        overflow: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.borderStrong}; border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        input:focus { outline: none; }
        button { font-family: inherit; }

        .ani-mobile-only { display: none !important; }
        .ani-desktop-only { display: flex; }

        @media (max-width: 880px) {
          .ani-mobile-only { display: flex !important; }
          .ani-desktop-only { display: none !important; }
          .ani-main-grid { grid-template-columns: 1fr !important; }
          .ani-kpi-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .ani-analytics-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 881px) and (max-width: 1180px) {
          .ani-kpi-grid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
        }
      `}</style>

      <Sidebar
        active={active} onNavigate={handleNavigate}
        collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        <Header title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setMobileOpen(true)} />
        <main className="ani-main" style={{ flex: 1, overflowY: "auto" }}>
          <Page />
        </main>
      </div>
      {toast && (
        <button type="button" className="ani-toast" onClick={() => setToast(null)}>
          {toast}
        </button>
      )}
    </div>
  );
}
