import { useEffect, useState } from 'react';
import '../styles/loader.css';

export default function Loader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let timer;
    const hide = () => {
      timer = setTimeout(() => setHidden(true), 200);
    };

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', hide);
    };
  }, []);

  return (
    <div className={`ring-loader-wrapper${hidden ? ' hidden' : ''}`}>
      <div className="loader-container">
        <div className="ring"></div>
        <div className="ring"></div>
        <div className="ring"></div>
        <div className="ring"></div>
        <h3 className="loading-text">Loading...</h3>
      </div>
    </div>
  );
}
