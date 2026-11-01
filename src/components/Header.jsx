import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import logo from '../assets/1-removebg-preview.png';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/toolkit', label: 'Toolkit' },
  { to: '/news', label: 'Latest News' },
  { to: '/support', label: 'Support' },
];

const linkClass = ({ isActive }) => `nav-animated-link${isActive ? ' selected' : ''}`;

export default function Header() {
  const { toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header>
        <h1>
          <img src={logo} alt="RapidResQ Logo" className="logo" />
        </h1>

        <ul id="nav-menu">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={linkClass}>
                {label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              className="theme-toggle-button"
              id="theme-toggle"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              <img
                src="https://img.icons8.com/ios-filled/50/FFFFFF/sun.png"
                alt="Sun Icon"
                className="icon sun-icon"
              />
              <img
                src="https://img.icons8.com/ios-filled/50/8892B0/moon-symbol.png"
                alt="Moon Icon"
                className="icon moon-icon"
              />
            </button>
          </li>
        </ul>

        <button
          className="mobile-nav-toggle"
          id="mobile-nav-toggle"
          aria-label="Open navigation menu"
          onClick={() => setMenuOpen(true)}
        >
          <i className="fas fa-bars"></i>
        </button>
      </header>

      <nav id="mobile-nav-menu" className={menuOpen ? 'active' : ''}>
        <button id="mobile-nav-close" aria-label="Close navigation menu" onClick={closeMenu}>
          &times;
        </button>
        <ul>
          {NAV_ITEMS.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={linkClass} onClick={closeMenu}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
