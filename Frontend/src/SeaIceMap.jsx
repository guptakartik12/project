import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  CircleMarker,
  Circle,
  Polyline,
  Tooltip,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { BHARATI, pctToLatLon, buildSicOverlay, nearestCell, highIceHotspots } from "./sicMap";

function MapResize({ height }) {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(id);
  }, [map, height]);
  return null;
}

function FitRegion({ bounds }) {
  const map = useMap();
  const lastKey = useRef("");
  useEffect(() => {
    if (!bounds) return;
    const key = JSON.stringify(bounds);
    if (key === lastKey.current) return;
    lastKey.current = key;
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 });
  }, [map, bounds]);
  return null;
}

function InspectClick({ field, onInspect }) {
  useMapEvents({
    click(e) {
      if (!onInspect || !field) return;
      onInspect(nearestCell(field, e.latlng.lat, e.latlng.lng));
    },
  });
  return null;
}

function vesselIcon(heading) {
  return L.divIcon({
    className: "ani-vessel-icon",
    html: `<div style="transform:rotate(${heading}deg);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:16px solid #0D2B3E;filter:drop-shadow(0 0 1px #fff)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function SeaIceMap({
  height,
  sicField,
  layers,
  station,
  vessel,
  destination,
  icebergs,
  routes,
  weather,
  selectedIcebergId,
  onSelectIceberg,
  onInspectCell,
}) {
  const overlay = useMemo(() => (layers.seaIce ? buildSicOverlay(sicField) : null), [sicField, layers.seaIce]);
  const hotspots = useMemo(
    () => (layers.riskZones && sicField ? highIceHotspots(sicField) : []),
    [sicField, layers.riskZones],
  );
  const stationLL = [station.lat, station.lon];
  const destLL = pctToLatLon(destination.position.x, destination.position.y);
  const vesselLL = pctToLatLon(vessel.position.x, vessel.position.y);
  const fitBounds = overlay?.bounds || [
    [station.lat - 3.5, station.lon - 8],
    [station.lat + 6, station.lon + 8],
  ];

  return (
    <MapContainer
      center={stationLL}
      zoom={5}
      minZoom={3}
      maxZoom={10}
      style={{ width: "100%", height: "100%", background: "#d9e7ee", cursor: "crosshair" }}
      attributionControl
    >
      <MapResize height={height} />
      <FitRegion bounds={fitBounds} />
      <InspectClick field={sicField} onInspect={onInspectCell} />
      <TileLayer
        attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {overlay && layers.seaIce && (
        <ImageOverlay url={overlay.url} bounds={overlay.bounds} opacity={0.7} />
      )}

      {layers.riskZones &&
        hotspots.map((z) => (
          <Circle
            key={z.id}
            center={[z.lat, z.lon]}
            radius={8000 + z.sic * 14000}
            eventHandlers={{ click: () => onInspectCell?.({ ...z, sic: z.sic }) }}
            pathOptions={{
              color: z.sic >= 0.85 ? "#A8503B" : "#B8895B",
              fillColor: z.sic >= 0.85 ? "#A8503B" : "#B8895B",
              fillOpacity: 0.18,
              weight: 1,
              dashArray: "4 4",
            }}
          >
            <Tooltip className="ani-map-tooltip">
              CNN SIC {Math.round(z.sic * 100)}% · {z.lat.toFixed(2)}°, {z.lon.toFixed(2)}°
            </Tooltip>
          </Circle>
        ))}

      {layers.icebergs &&
        icebergs.map((ib) => (
          <Polyline
            key={`traj-${ib.id}`}
            positions={ib.trajectory.map((p) => pctToLatLon(p.x, p.y))}
            pathOptions={{ color: "#0F6E8C", weight: 2, dashArray: "4 4", opacity: 0.75 }}
          />
        ))}

      {layers.alternativeRoutes && (
        <>
          <Polyline
            positions={routes.fastest.path.map((p) => pctToLatLon(p.x, p.y))}
            pathOptions={{ color: routes.fastest.color, weight: 2, dashArray: "6 6" }}
          />
          <Polyline
            positions={routes.safest.path.map((p) => pctToLatLon(p.x, p.y))}
            pathOptions={{ color: routes.safest.color, weight: 2, dashArray: "6 6" }}
          />
        </>
      )}

      {layers.recommendedRoute && (
        <Polyline
          positions={routes.recommended.path.map((p) => pctToLatLon(p.x, p.y))}
          pathOptions={{ color: routes.recommended.color, weight: 4 }}
        />
      )}

      {layers.wind &&
        [
          { x: 20, y: 25 },
          { x: 40, y: 30 },
          { x: 60, y: 25 },
          { x: 78, y: 35 },
          { x: 25, y: 55 },
          { x: 50, y: 55 },
          { x: 72, y: 60 },
        ].map((p, i) => {
          const [lat, lon] = pctToLatLon(p.x, p.y);
          const rad = ((weather.windBearing - 90) * Math.PI) / 180;
          const lat2 = lat + Math.sin(rad) * 0.35;
          const lon2 = lon + Math.cos(rad) * 0.55;
          return (
            <Polyline
              key={`w-${i}`}
              positions={[
                [lat, lon],
                [lat2, lon2],
              ]}
              pathOptions={{ color: "#3D5A6C", weight: 2, opacity: 0.7 }}
            />
          );
        })}

      <CircleMarker
        center={[BHARATI.lat, BHARATI.lon]}
        radius={7}
        pathOptions={{ color: "#ffffff", fillColor: "#0D2B3E", fillOpacity: 1, weight: 2 }}
      >
        <Tooltip permanent direction="bottom" offset={[0, 8]} className="ani-map-tooltip">
          Bharati Station
        </Tooltip>
      </CircleMarker>

      {layers.vessel && (
        <CircleMarker
          center={destLL}
          radius={6}
          pathOptions={{ color: "#0F6E8C", fillColor: "#ffffff", fillOpacity: 1, weight: 2 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]} className="ani-map-tooltip">
            {destination.name}
          </Tooltip>
        </CircleMarker>
      )}

      {layers.icebergs &&
        icebergs.map((ib) => {
          const [lat, lon] = pctToLatLon(ib.position.x, ib.position.y);
          const selected = selectedIcebergId === ib.id;
          return (
            <CircleMarker
              key={ib.id}
              center={[lat, lon]}
              radius={selected ? 9 : 6}
              eventHandlers={{ click: () => onSelectIceberg(selected ? null : ib.id) }}
              pathOptions={{
                color: "#fff",
                fillColor: ib.risk === "Moderate" ? "#B8895B" : "#4B93AC",
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Tooltip direction="right" offset={[8, 0]} className="ani-map-tooltip">
                {ib.id}
              </Tooltip>
            </CircleMarker>
          );
        })}

      {layers.vessel && (
        <Marker position={vesselLL} icon={vesselIcon(vessel.heading)}>
          <Tooltip permanent direction="top" offset={[0, -10]} className="ani-map-tooltip">
            {vessel.name}
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
