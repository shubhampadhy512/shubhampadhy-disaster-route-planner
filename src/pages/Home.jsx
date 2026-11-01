import { useState } from 'react';
import { Link } from 'react-router-dom';
import WeatherCard from '../components/WeatherCard.jsx';
import MapView from '../components/MapView.jsx';
import locationImage from '../assets/location_image.jpg';
import disasterImage from '../assets/disaster_image1.jpg';
import { DISASTER_GUIDES } from '../data/disasterGuides.js';
import '../styles/content-pages.css';
import '../styles/home.css';

const KIT_ITEMS = ['Water & Food', 'First Aid', 'Flashlight', 'Important Documents'];

const OVERVIEW = [
  { label: 'Emergency help', value: '112', icon: 'fa-phone-volume' },
  { label: 'Safety guides', value: `${DISASTER_GUIDES.length}`, icon: 'fa-shield-heart' },
  { label: 'Go-bag essentials', value: `${KIT_ITEMS.length}`, icon: 'fa-kit-medical' },
  { label: 'Live local alerts', value: 'Not connected', icon: 'fa-circle-info', valueClass: 'home-status-feed' },
];

const QUICK_HAZARDS = DISASTER_GUIDES.slice(0, 4);

const MAP_TABS = [
  { key: 'map', label: 'Interactive Map', icon: 'fa-map-marked-alt', target: 'dashboard-map' },
  { key: 'guidance', label: 'Safety guidance', icon: 'fa-shield-heart', target: 'home-safety-guides' },
];

export default function Home() {
  const [location, setLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  const handleTabClick = (event, tab) => {
    event.preventDefault();
    setActiveTab(tab.key);
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

              <div className="alert-content">
                <h2>About this map</h2>
                <p>
                  The map shows your location when you allow access. It does not show verified
                  disaster alerts, evacuation routes, or shelter availability.
                </p>
                <Link to="/news">Read the latest reports</Link>
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
                <MapView location={location} />
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
              location and the weather panel can show local conditions. You can deny access and
              enter a city manually. This map does not provide verified hazard alerts, shelter
              locations, or evacuation routes; always check local emergency authorities.
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
