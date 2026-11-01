import socialLinks from '../data/socialLinks.js';

export default function Footer({ detailed = false }) {
  if (!detailed) {
    return (
      <footer>
        <p>© 2025 Disaster Alert and Evacuation Route Planner</p>
      </footer>
    );
  }

  return (
    <footer>
      <div className="footer-bottom">
        <p>© 2025 Global Disaster Alert | Data sources include IMD &amp; NDMA.</p>
        <p className="footer-disclaimer">
          <strong>Disclaimer:</strong> This is an informational tool. Always follow guidance from
          local emergency authorities.
        </p>
        <ul className="example-2" id="symbol">
          {socialLinks.map(({ key, label, href, path }) => (
            <li className="icon-content" key={key}>
              <a href={href} aria-label={label} data-social={key}>
                <div className="filled"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className={`bi bi-${key}`}
                  viewBox="0 0 16 16"
                >
                  <path d={path} fill="currentColor"></path>
                </svg>
              </a>
              <div className="tooltip">{label}</div>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
