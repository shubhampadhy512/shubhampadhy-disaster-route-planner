import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/content-pages.css';
import '../styles/toolkit.css';
import { DISASTER_GUIDES } from '../data/disasterGuides.js';

const KIT = [
  {
    title: 'Water & food',
    text: 'Store at least three days of drinking water and shelf-stable food for each person.',
    icon: 'fa-bottle-water',
  },
  {
    title: 'First-aid kit',
    text: 'Pack bandages, antiseptic, pain relievers, and a supply of personal medications.',
    icon: 'fa-kit-medical',
  },
  {
    title: 'Light & communication',
    text: 'Keep a flashlight, spare batteries, and a hand-crank or battery-powered radio.',
    icon: 'fa-tower-broadcast',
  },
  {
    title: 'Important documents',
    text: 'Protect copies of identification, insurance, and bank records in a waterproof pouch.',
    icon: 'fa-file-shield',
  },
];

export default function Toolkit() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [selectedGuide, setSelectedGuide] = useState(DISASTER_GUIDES[0]);

  useEffect(() => {
    const guideFromHash = DISASTER_GUIDES.find(({ id }) => id === hash.slice(1));
    if (guideFromHash) setSelectedGuide(guideFromHash);
  }, [hash]);

  const selectGuide = (guide) => {
    setSelectedGuide(guide);
    navigate({ hash: guide.id }, { replace: true });
  };

  return (
    <main className="toolkit-page">
      <div className="toolkit-wrap">
        <section id="toolkit" className="toolkit-hero" aria-labelledby="toolkit-title">
          <div className="toolkit-hero-copy">
            <p className="page-eyebrow">
              <i className="fas fa-shield-heart" aria-hidden="true"></i>
              Be ready. Stay safe.
            </p>
            <h1 id="toolkit-title">Your preparedness toolkit</h1>
            <p>
              A little preparation goes a long way. Use this practical guide to build an emergency
              go-bag and make a plan before a disaster happens.
            </p>
          </div>
          <div className="toolkit-hero-mark" aria-hidden="true">
            <i className="fas fa-kit-medical"></i>
          </div>
        </section>

        <section className="toolkit-section" aria-labelledby="go-bag-title">
          <div className="toolkit-section-heading">
            <div>
              <h2 id="go-bag-title">Build your go-bag</h2>
              <p>Keep essentials together somewhere easy to reach.</p>
            </div>
          </div>
          <div className="toolkit-kit-grid">
            {KIT.map(({ title, text, icon }) => (
              <article className="toolkit-kit-card" key={title}>
                <span className="toolkit-kit-icon" aria-hidden="true">
                  <i className={`fas ${icon}`}></i>
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
          <aside className="toolkit-note">
            <i className="fas fa-circle-info" aria-hidden="true"></i>
            <span>
              Review your supplies every six months. Adjust your kit for children, older adults,
              pets, and any specific medical needs.
            </span>
          </aside>
        </section>

        <section className="toolkit-section" aria-labelledby="disaster-safety-title">
          <div className="toolkit-section-heading">
            <div>
              <h2 id="disaster-safety-title">Know what to do</h2>
              <p>
                Quick safety steps for different emergencies. Follow local officials’ instructions
                first.
              </p>
            </div>
          </div>
          <div className="toolkit-disaster-picker" aria-label="Choose a disaster">
            {DISASTER_GUIDES.map((guide) => (
              <button
                className={`toolkit-disaster-button${guide.id === selectedGuide.id ? ' active' : ''}`}
                key={guide.id}
                type="button"
                aria-pressed={guide.id === selectedGuide.id}
                onClick={() => selectGuide(guide)}
              >
                <i className={`fas ${guide.icon}`} aria-hidden="true"></i>
                {guide.title}
              </button>
            ))}
          </div>
          <div className="toolkit-safety-grid">
            <article className="toolkit-safety-card" id={selectedGuide.id} key={selectedGuide.id}>
              <div className="toolkit-safety-title">
                <span className="toolkit-kit-icon" aria-hidden="true">
                  <i className={`fas ${selectedGuide.icon}`}></i>
                </span>
                <h3>{selectedGuide.title} safety guidance</h3>
              </div>
              <div className="toolkit-safety-detail">
                <strong>Do this</strong>
                <p>{selectedGuide.action}</p>
              </div>
              <div className="toolkit-safety-detail toolkit-safety-avoid">
                <strong>Avoid</strong>
                <p>{selectedGuide.avoid}</p>
              </div>
            </article>
          </div>
          <aside className="toolkit-emergency-callout">
            <i className="fas fa-phone-volume" aria-hidden="true"></i>
            <p>
              <strong>Need urgent help in India?</strong> Call 112 where available, or contact your
              local emergency services. Share your location and follow official instructions.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
