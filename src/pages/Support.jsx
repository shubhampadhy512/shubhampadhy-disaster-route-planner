import { useState } from 'react';
import '../styles/content-pages.css';
import '../styles/support.css';

export default function Support() {
  const [feedback, setFeedback] = useState('');
  const [popupOpen, setPopupOpen] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setPopupOpen(true);
    setFeedback('');
  };

  const closePopup = () => setPopupOpen(false);

  return (
    <main className="support-page">
      <div className="support-wrap">
        <section id="support" className="support-hero" aria-labelledby="support-title">
          <div className="support-hero-copy">
            <p className="page-eyebrow">
              <i className="fas fa-headset" aria-hidden="true"></i>
              Here when you need us
            </p>
            <h1 id="support-title">How can we help?</h1>
            <p>
              Get in touch with our support team for help with the platform, preparedness
              information, or sharing feedback.
            </p>
          </div>
          <div className="support-hero-mark" aria-hidden="true">
            <i className="fas fa-comments"></i>
          </div>
        </section>

        <section className="support-section" aria-labelledby="contact-title">
          <div className="support-section-heading">
            <h2 id="contact-title">Contact our team</h2>
            <p>Choose the best way to reach us. We’re ready to help.</p>
          </div>
          <div className="support-contact-grid">
            <article className="support-contact-card">
              <span className="support-contact-icon" aria-hidden="true">
                <i className="fas fa-envelope"></i>
              </span>
              <h3>Email</h3>
              <a href="mailto:support@disasteralert.com">support@disasteralert.com</a>
            </article>
            <article className="support-contact-card">
              <span className="support-contact-icon" aria-hidden="true">
                <i className="fas fa-phone"></i>
              </span>
              <h3>Phone</h3>
              <a href="tel:+18001234567">1-800-123-4567</a>
            </article>
            <article className="support-contact-card">
              <span className="support-contact-icon" aria-hidden="true">
                <i className="fas fa-location-dot"></i>
              </span>
              <h3>Office</h3>
              <p>123 Disaster Preparedness Ave, Safety City, 12345</p>
            </article>
          </div>
        </section>

        <section className="support-section" aria-labelledby="faq-title">
          <div className="support-section-heading">
            <h2 id="faq-title">Frequently asked questions</h2>
            <p>Quick answers to help you get started.</p>
          </div>
          <div className="support-faq-grid">
            <article className="support-faq-card">
              <h3>
                <i className="fas fa-circle-question" aria-hidden="true"></i>
                Where can I find emergency preparedness advice?
              </h3>
              <p>Visit the Toolkit for practical guidance on supplies, planning, and readiness.</p>
            </article>
            <article className="support-faq-card">
              <h3>
                <i className="fas fa-circle-question" aria-hidden="true"></i>
                How do I contact the support team?
              </h3>
              <p>Call or email us using the contact details above and we’ll be glad to assist.</p>
            </article>
          </div>
        </section>

        <section id="feedback-section" className="support-section support-feedback">
          <h2>Share your feedback</h2>
          <p className="support-feedback-intro">
            Tell us how we can improve your experience. Your feedback helps us make this service
            more useful.
          </p>
          <form id="feedback-form" className="support-feedback-form" onSubmit={handleSubmit}>
            <label htmlFor="feedback-input">Your message</label>
            <textarea
              id="feedback-input"
              name="feedback"
              rows="5"
              placeholder="Write your feedback here…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            ></textarea>
            <button type="submit">
              <i className="fas fa-paper-plane" aria-hidden="true"></i>
              Submit feedback
            </button>
          </form>
        </section>
      </div>

      <div
        id="feedback-popup"
        className={`support-popup${popupOpen ? '' : ' hidden'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-popup-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) closePopup();
        }}
      >
        <div className="support-popup-content">
          <span className="support-popup-icon" aria-hidden="true">
            <i className="fas fa-check"></i>
          </span>
          <h2 id="feedback-popup-title">Thank you for your feedback</h2>
          <p>We appreciate you taking the time to help us improve the service.</p>
          <button id="close-popup" type="button" onClick={closePopup}>
            Done
          </button>
        </div>
      </div>
    </main>
  );
}
