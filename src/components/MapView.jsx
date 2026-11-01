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

export default function MapView({ location }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Create the map once
  useEffect(() => {
    const map = L.map(containerRef.current).setView(INDIA_CENTER, START_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Fly to the user's location whenever it becomes known
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !location) return;

    const { lat, lon } = location;
    map.flyTo([lat, lon], 12, { animate: true, duration: 4 });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = L.marker([lat, lon])
        .addTo(map)
        .bindPopup('<b>Your location</b>');
    }
    markerRef.current.openPopup();
  }, [location]);

  return <div id="dashboard-map" ref={containerRef}></div>;
}
