import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default marker icons break when bundled, so point them at the imported files
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const INDIA_CENTER = [20.5937, 78.9629];
const START_ZOOM = 3;

// Shelter names come from OpenStreetMap, which anyone can edit, so never put
// them into popup HTML without escaping.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// NEW: alert colour by severity
const sevColor = (s) =>
  ({ Extreme: '#b91c1c', Severe: '#ea580c', Moderate: '#ca8a04' }[s] || '#2563eb');

// NEW: one symbol per alert type
const ALERT_EMOJI = [
  [/cyclone/i, '\u{1F300}'],
  [/surge|wave|tsunami|flood/i, '\u{1F30A}'],
  [/lightning|thunder/i, '\u26A1'],
  [/rain/i, '\u{1F327}\uFE0F'],
  [/heat/i, '\u{1F525}'],
  [/wind|gale/i, '\u{1F4A8}'],
  [/landslide/i, '\u26F0\uFE0F'],
  [/earthquake/i, '\u{1F30D}'],
  [/fog/i, '\u{1F32B}\uFE0F'],
];
const alertEmoji = (event) =>
  (ALERT_EMOJI.find(([re]) => re.test(event || '')) || [null, '\u26A0\uFE0F'])[1];

// centre of a shape's bounding box, as [lat, lon]
function bboxCenter(geom) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      w = Math.min(w, c[0]); e = Math.max(e, c[0]);
      s = Math.min(s, c[1]); n = Math.max(n, c[1]);
    } else c.forEach(walk);
  };
  walk(geom.coordinates);
  return [(s + n) / 2, (w + e) / 2];
}

/**
 * Props
 *  location        { lat, lon } or null          (the user's position)
 *  shelters        GeoJSON FeatureCollection or null
 *  selectedShelter { id, latlng: [lat, lon] } or null  (keep it stable with useMemo)
 *  onRoute         optional callback: ({ km, min, approximate } | null)
 *  alertGeo        NEW: GeoJSON FeatureCollection of alert shapes from server.mjs, or null
 */
export default function MapView({
  location,
  shelters,
  selectedShelter,
  onRoute,
  alertGeo,
  nearbyShelters, // NEW: shelters within 50 km (used for the Shelters button)
  shelterFocus, // NEW: number that goes up each time the Shelters button is clicked
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const alertLayerRef = useRef(null); // NEW: alert symbols
  const highlightLayerRef = useRef(null); // NEW: shape of the clicked alert
  const shelterLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const onRouteRef = useRef(onRoute);

  useEffect(() => {
    onRouteRef.current = onRoute;
  }, [onRoute]);

  // Create the map once
  useEffect(() => {
    // preferCanvas keeps the map fast when thousands of shelter dots are drawn
    const map = L.map(containerRef.current, { preferCanvas: true }).setView(INDIA_CENTER, START_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // NEW: alerts are added first so shelters and routes draw on top of them
    // Own layers (panes) so shelters are never hidden under alert shapes
    map.createPane('alertPane').style.zIndex = 410;
    map.createPane('shelterPane').style.zIndex = 450;
    alertLayerRef.current = L.layerGroup().addTo(map);
    highlightLayerRef.current = L.layerGroup().addTo(map);
    shelterLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      alertLayerRef.current = null; // NEW
      highlightLayerRef.current = null; // NEW
      shelterLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // NEW: draw ONE symbol per alert; the full shape shows only after you click it
  useEffect(() => {
    const layer = alertLayerRef.current;
    const hl = highlightLayerRef.current;
    if (!layer || !hl) return;
    layer.clearLayers();
    hl.clearLayers();
    if (!alertGeo?.features?.length) return;

    const byId = new Map();
    alertGeo.features.forEach((f, i) => {
      const id = f.properties?.id ?? `x${i}`;
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(f);
    });

    byId.forEach((feats) => {
      const p = feats[0].properties || {};
      const color = sevColor(p.severity);
      const icon = L.divIcon({
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        html:
          `<div style="width:30px;height:30px;border-radius:50%;background:${color};` +
          `border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);display:flex;` +
          `align-items:center;justify-content:center;font-size:16px;">${alertEmoji(p.event)}</div>`,
      });
      L.marker(bboxCenter(feats[0].geometry), {
        icon,
        zIndexOffset: p.severity === 'Extreme' ? 1000 : p.severity === 'Severe' ? 500 : 0,
      })
        .bindPopup(
          `<b>${esc(p.event)}</b> (${esc(p.severity)})<br>${esc(p.areaDesc)}` +
          `<br><small>From ${esc(p.sender)}</small>`
        )
        .on('popupopen', () => {
          hl.clearLayers();
          L.geoJSON(
            { type: 'FeatureCollection', features: feats },
            { pane: 'alertPane', style: { color, weight: 2, fillOpacity: 0.2 } }
          ).addTo(hl);
        })
        .on('popupclose', () => hl.clearLayers())
        .addTo(layer);
    });
  }, [alertGeo]);

  // Fly to the user's location whenever it becomes known
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    const { lat, lon } = location;
    map.flyTo([lat, lon], 12, { animate: true, duration: 1.5 });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = L.marker([lat, lon])
        .addTo(map)
        .bindPopup('<b>Your location</b>');
    }
    markerRef.current.openPopup();
  }, [location]);

  // NEW: Shelters button -> zoom the map so the shelters are in view
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !shelterFocus) return;
    const src = nearbyShelters?.features?.length ? nearbyShelters : shelters;
    const pts = (src?.features || []).map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);
    if (!pts.length) return;
    if (location) pts.push([location.lat, location.lon]);
    map.fitBounds(pts, { padding: [48, 48], maxZoom: 13 });
  }, [shelterFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw shelters as green dots (the chosen one is bigger)
  useEffect(() => {
    const layer = shelterLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    shelters?.features.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      const isSelected = selectedShelter?.id === f.properties.id;
      L.circleMarker([lat, lon], {
        pane: 'shelterPane',
        radius: isSelected ? 11 : 7,
        color: '#ffffff',
        weight: 2,
        fillColor: '#2f7d4f',
        fillOpacity: 1,
      })
        .bindPopup(`<b>${esc(f.properties.name)}</b><br>${esc(f.properties.type)}`)
        .addTo(layer);
    });
  }, [shelters, selectedShelter]);

  // Draw the route from the user to the chosen shelter
  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    onRouteRef.current?.(null);
    if (!location || !selectedShelter) return;

    const from = [location.lat, location.lon];
    const to = selectedShelter.latlng;
    const ctrl = new AbortController();

    // Public OSRM demo server: fine for testing, not for production.
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        const route = j.routes?.[0];
        if (!route) throw new Error('no route');
        L.geoJSON(route.geometry, { style: { color: '#1f6f8b', weight: 5 } }).addTo(layer);
        map.fitBounds([from, to], { padding: [48, 48] });
        onRouteRef.current?.({ km: route.distance / 1000, min: route.duration / 60, approximate: false });
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        // Road route failed: show a dashed straight line and say it's only a direction
        L.polyline([from, to], { color: '#1f6f8b', weight: 3, dashArray: '6 8' }).addTo(layer);
        map.fitBounds([from, to], { padding: [48, 48] });
        onRouteRef.current?.({ km: null, min: null, approximate: true });
      });

    return () => ctrl.abort();
  }, [location, selectedShelter]);

  return <div id="dashboard-map" ref={containerRef}></div>;
}