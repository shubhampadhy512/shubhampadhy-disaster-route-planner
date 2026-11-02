import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import WeatherCard from '../components/WeatherCard.jsx';
import MapView from '../components/MapView.jsx';
import { nearestShelters } from '../utils/geo.js';
import { loadAllShelters, withinKm } from '../utils/shelterLoader.js'; // CHANGED
import locationImage from '../assets/location_image.jpg';
import disasterImage from '../assets/disaster_image1.jpg';
import { DISASTER_GUIDES } from '../data/disasterGuides.js';
import '../styles/content-pages.css';
import '../styles/home.css';
import '../styles/live-panel.css';

// ---- Settings: change these for your project --------------------------------
const ALERTS_URL = 'http://localhost:3001/api/alerts'; // server.mjs
const SHELTER_RADIUS_KM = 50; // the nearest-shelters list and route use this distance; the map shows all
const REFRESH_MS = 5 * 60 * 1000; // refresh alerts every 5 minutes
// -----------------------------------------------------------------------------

const KIT_ITEMS = ['Water & Food', 'First Aid', 'Flashlight', 'Important Documents'];

const QUICK_HAZARDS = DISASTER_GUIDES.slice(0, 4);

const MAP_TABS = [
  { key: 'map', label: 'Interactive Map', icon: 'fa-map-marked-alt', target: 'dashboard-map' },
  { key: 'shelters', label: 'Shelters', icon: 'fa-house-medical', target: 'dashboard-map' },
  { key: 'guidance', label: 'Safety guidance', icon: 'fa-shield-heart', target: 'home-safety-guides' },
];

const SEVERITY_RANK = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3 };

function formatTime(iso) {
  if (!iso) return 'unknown';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Home() {
  const [location, setLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  // Live data
  const [payload, setPayload] = useState(null); // response from server.mjs
  const [alertsError, setAlertsError] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [shelters, setShelters] = useState(null);
  const [sheltersError, setSheltersError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [shelterFocus, setShelterFocus] = useState(0); // goes up each time the Shelters tab is clicked

  // Load alerts now, then again every 5 minutes
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(ALERTS_URL);
        if (!res.ok) throw new Error(res.status);
        const json = await res.json();
        if (!stop) {
          setPayload(json);
          setAlertsError(false);
        }
      } catch {
        if (!stop) setAlertsError(true);
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  // CHANGED: load ALL shelters once so the map can show every one of them
  useEffect(() => {
    let stop = false;
    loadAllShelters()
      .then((fc) => {
        if (!stop) setShelters(fc);
      })
      .catch(() => {
        if (!stop) setSheltersError(true);
      });
    return () => {
      stop = true;
    };
  }, []);

  const alerts = useMemo(
    () =>
      [...(payload?.alerts ?? [])].sort(
        (a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9)
      ),
    [payload]
  );
  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 5);

  // NEW: alert shapes for the map (from server.mjs "geojson" field)
  const alertGeo = payload?.geojson ?? null;
  const shapeCount = alertGeo?.features?.length ?? 0;

  // Nearest shelters are worked out on the user's device; location is never sent anywhere
  // CHANGED: the map gets ALL shelters; the list and route only use those within 50 km
  const nearbyShelters = useMemo(
    () => withinKm(shelters, location, SHELTER_RADIUS_KM),
    [shelters, location]
  );
  const nearest = useMemo(
    () => nearestShelters(location, nearbyShelters),
    [location, nearbyShelters]
  );
  const selected = useMemo(
    () => nearest.find((s) => s.id === selectedId) ?? nearest[0] ?? null,
    [nearest, selectedId]
  );

  const alertsStatus = payload ? `${alerts.length} active` : alertsError ? 'Not connected' : 'Loading…';

  const OVERVIEW = [
    { label: 'Emergency help', value: '112', icon: 'fa-phone-volume' },
    { label: 'Safety guides', value: `${DISASTER_GUIDES.length}`, icon: 'fa-shield-heart' },
    { label: 'Go-bag essentials', value: `${KIT_ITEMS.length}`, icon: 'fa-kit-medical' },
    {
      label: 'Live alerts (India)',
      value: alertsStatus,
      icon: 'fa-circle-info',
      valueClass: payload ? '' : 'home-status-feed',
    },
  ];

  const handleTabClick = (event, tab) => {
    event.preventDefault();
    setActiveTab(tab.key);
    if (tab.key === 'shelters') setShelterFocus((n) => n + 1);
    if (tab.target) {
      document.getElementById(tab.target)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <main>
        <section id="home" className="view-section">
          <h2>Emergency readiness dashboard</h2>
          <p>
            Check your local conditions, prepare essential supplies, and find practical safety
            guidance. For urgent situations, follow official local instructions.
          </p>

          <aside className="home-emergency-banner">
            <span className="home-emergency-icon" aria-hidden="true">
              <i className="fas fa-triangle-exclamation"></i>
            </span>
            <div>
              <strong>In immediate danger?</strong>
              <p>Call 112 in India where available. Move to safety and follow emergency responders.</p>
            </div>
            <a className="home-emergency-call" href="tel:112">
              <i className="fas fa-phone" aria-hidden="true"></i>
              Call 112
            </a>
          </aside>

          <div className="dashboard-container">
            <aside className="sidebar">
              <h2 className="sidebar-title">System Overview</h2>

              <div className="overview-cards">
                {OVERVIEW.map(({ label, value, valueClass, icon }) => (
                  <div
                    className={`card home-summary-card${valueClass ? ` ${valueClass}` : ''}`}
                    key={label}
                  >
                    <div className="card-label">{label}</div>
                    <div className="card-value-container">
                      <div className="card-value">{value}</div>
                      <i className={`fas ${icon}`}></i>
                    </div>
                  </div>
                ))}
              </div>

              <WeatherCard onLocation={setLocation} />

              {/* ---------- Live alerts ---------- */}
              <div className="alert-content live-panel">
                <h2>Active alerts</h2>

                {alertsError && (
                  <p className="live-warn" role="status">
                    Can&apos;t reach the alert server.
                    {payload ? ' Showing the last alerts received.' : ' Start it with node server.mjs.'}
                  </p>
                )}
                {payload?.stale && (
                  <p className="live-warn" role="status">
                    Alert data may be out of date. Check sachet.ndma.gov.in.
                  </p>
                )}
                {payload && (
                  <p className="live-meta">Updated {formatTime(payload.fetchedAt)}</p>
                )}
                <p className="live-note">
                  These are alerts for all of India from NDMA SACHET. This page doesn&apos;t check
                  yet whether an alert covers your location.
                </p>
                {/* NEW: tells the user why some alerts have no shape on the map */}
                {payload && (
                  <p className="live-note">
                    {shapeCount > 0
                      ? 'Alert areas are drawn on the map where the source provides a shape. Some alerts only have a text area.'
                      : 'No alert shapes are available for the map right now. Read the alert text below.'}
                  </p>
                )}

                <ul className="live-alerts">
                  {visibleAlerts.map((a) => (
                    <li key={a.id} className={`sev-${(a.severity || 'unknown').toLowerCase()}`}>
                      <div className="live-alert-head">
                        <strong>{a.event || 'Alert'}</strong>
                        <span className="live-chip">{a.severity || 'Unknown'}</span>
                      </div>
                      <div>{(a.areas ?? []).slice(0, 3).join('; ') || 'Area not listed'}</div>
                      <div className="live-meta">
                        From {a.sender || 'unknown'}. Expires {formatTime(a.expires)}
                        {a.hasShape === false && ' · not shown on map'}
                      </div>
                    </li>
                  ))}
                  {payload && alerts.length === 0 && (
                    <li className="live-empty">No active alerts right now.</li>
                  )}
                </ul>

                {alerts.length > 5 && (
                  <button
                    type="button"
                    className="live-link-button"
                    onClick={() => setShowAllAlerts((v) => !v)}
                  >
                    {showAllAlerts ? 'Show fewer alerts' : `Show all ${alerts.length} alerts`}
                  </button>
                )}

                <Link to="/news">Read the latest reports</Link>
              </div>

              {/* ---------- Nearest shelters ---------- */}
              <div id="dashboard-shelters" className="alert-content live-panel">
                <h2>Nearest shelters</h2>

                {!location && (
                  <p className="live-note">
                    Allow location access to see the shelters closest to you.
                  </p>
                )}
                {sheltersError && (
                  <p className="live-warn" role="status">
                    Shelter data could not be loaded. Check that public/shelters/index.json and the
                    state files exist.
                  </p>
                )}
                {/* CHANGED: message for when nothing is within 50 km */}
                {location && shelters && nearbyShelters.features.length === 0 && (
                  <p className="live-warn" role="status">
                    No shelters in our data within {SHELTER_RADIUS_KM} km. This does not mean there
                    are none. Ask your state disaster authority or district collector for official
                    shelter locations.
                  </p>
                )}
                {shelters && nearbyShelters.features.length > 0 && nearbyShelters.features.length < 20 && (
                  <p className="live-warn" role="status">
                    Only {nearbyShelters.features.length} shelters are loaded nearby, so this list is
                    incomplete. Ask your local disaster authority for official shelter locations.
                  </p>
                )}

                <ul className="live-shelters">
                  {nearest.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={selected?.id === s.id ? 'is-selected' : ''}
                        onClick={() => setSelectedId(s.id)}
                      >
                        <span>{s.name}</span>
                        <span className="live-meta">{s.km.toFixed(1)} km away in a straight line</span>
                      </button>
                    </li>
                  ))}
                </ul>

                {routeInfo && (
                  <p className="live-route">
                    {routeInfo.approximate
                      ? 'Road route unavailable. The dashed line shows direction only.'
                      : `By road: ${routeInfo.km.toFixed(1)} km, about ${Math.round(routeInfo.min)} min.`}
                  </p>
                )}
                <p className="live-note">
                  Shelter data is unverified. Routes don&apos;t know about floods or blocked roads.
                  Follow instructions from local authorities.
                </p>
              </div>
            </aside>

            <main className="main-content">
              <nav className="main-nav">
                {MAP_TABS.map((tab) => (
                  <a
                    key={tab.key}
                    href={tab.target ? `#${tab.target}` : '#'}
                    className={`nav-link${activeTab === tab.key ? ' active' : ''}`}
                    onClick={(e) => handleTabClick(e, tab)}
                  >
                    <i className={`fas ${tab.icon}`}></i>
                    {tab.label}
                  </a>
                ))}
              </nav>

              <div className="map-area">
                <MapView
                  location={location}
                  shelters={shelters}
                  selectedShelter={selected}
                  onRoute={setRouteInfo}
                  alertGeo={alertGeo}
                  nearbyShelters={nearbyShelters}
                  shelterFocus={shelterFocus}
                />
                <div className="home-map-note">
                  <i className="fas fa-location-dot" aria-hidden="true"></i>
                  <span>Your location only appears here when you allow browser access.</span>
                </div>
              </div>

            </main>
          </div>

          <section className="home-safety-guides" id="home-safety-guides" aria-labelledby="home-safety-title">
            <div className="home-safety-heading">
              <div>
                <p className="page-eyebrow">Practical next steps</p>
                <h2 id="home-safety-title">Find guidance for a specific disaster</h2>
                <p>Choose a guide for immediate precautions and what to avoid.</p>
              </div>
              <Link to="/toolkit">View all safety guides</Link>
            </div>
            <div className="home-hazard-links">
              {QUICK_HAZARDS.map(({ id, title, icon }) => (
                <Link className="home-hazard-link" key={id} to={`/toolkit#${id}`}>
                  <span aria-hidden="true">
                    <i className={`fas ${icon}`}></i>
                  </span>
                  <strong>{title}</strong>
                  <i className="fas fa-arrow-right home-hazard-arrow" aria-hidden="true"></i>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </main>

      <main>
        <section className="view-section">
          <div>
            <h2>Location &amp; privacy</h2>
          </div>
          <div className="location_image">
            <img src={locationImage} alt="Location access illustration" />
            <p>
              Location access is optional. If you allow it, the map can center on your current
              location, find the shelters closest to you, and the weather panel can show local
              conditions. Your location stays in your browser and is not sent to our servers. You
              can deny access and enter a city manually. Alerts come from NDMA SACHET and shelter
              data is unverified and incomplete; always check local emergency authorities.
            </p>
          </div>
        </section>
      </main>

      <main>
        <section className="view-section">
          <div>
            <h2>Preparedness starts before an emergency.</h2>
          </div>
          <div className="disaster_image1">
            <p>
              Keep a go-bag ready, agree on a family meeting point, and learn the safest exits from
              your home and workplace. In an emergency, rely on current instructions from local
              authorities rather than unverified posts or old information.
            </p>
            <img src={disasterImage} alt="Disaster response illustration" />
          </div>
        </section>
      </main>

      <main>
        <section className="additional-cards-section view-section">
          <h2>Quick Resources</h2>
          <div className="cards-grid">
            <div className="info-card">
              <div className="card-icon">
                <i className="fas fa-phone-volume"></i>
              </div>
              <h3>Emergency Contacts</h3>
              <ul>
                <li>India emergency response: <strong>112</strong></li>
              </ul>
              <a className="card-button" href="tel:112">Call 112</a>
            </div>

            <div className="info-card">
              <div className="card-icon">
                <i className="fas fa-box-open"></i>
              </div>
              <h3>Emergency Kit Checklist</h3>
              <ul className="checklist">
                {KIT_ITEMS.map((item) => (
                  <li key={item}>
                    <i className="fas fa-check-circle"></i> {item}
                  </li>
                ))}
              </ul>
              <Link className="card-button" to="/toolkit#go-bag-title">Build Your Kit</Link>
            </div>

            <div className="info-card">
              <div className="card-icon">
                <i className="fas fa-hands-helping"></i>
              </div>
              <h3>Community Support</h3>
              <p>Contact our team for help with this platform or share feedback.</p>
              <Link className="card-button" to="/support">Contact Support</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}