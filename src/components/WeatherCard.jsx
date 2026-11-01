import { useCallback, useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

const DEFAULT_CITY = 'Mumbai';
const DEFAULT_COORDS = { lat: 19.076, lon: 72.8777 };

const ERROR_CLASS = 'weather-error-message';
const INFO_CLASS = 'weather-info-message';

function geoErrorMessage(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access denied. Using default location.';
    case error.POSITION_UNAVAILABLE:
      return 'Location information is unavailable. Using default location.';
    case error.TIMEOUT:
      return 'Location request timed out. Using default location.';
    default:
      return 'An unknown error occurred. Using default location.';
  }
}

function savedCity() {
  try {
    return localStorage.getItem('weatherCity') || DEFAULT_CITY;
  } catch {
    return DEFAULT_CITY;
  }
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Shows the current weather. On mount it asks for the browser location,
 * loads the weather for it and reports the coordinates through `onLocation`
 * so the map can fly there.
 */
export default function WeatherCard({ onLocation }) {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', className: ERROR_CLASS });

  const fetchWeather = useCallback(async (query, { keepMessage = false } = {}) => {
    setLoading(true);
    if (!keepMessage) setMessage({ text: '', className: ERROR_CLASS });

    try {
      const response = await fetch(`${WEATHER_URL}?${query}&appid=${API_KEY}&units=metric`);

      if (!response.ok) {
        if (response.status === 404) {
          setMessage({ text: 'City not found.', className: ERROR_CLASS });
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setWeather({
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6), // m/s -> km/h
        desc: capitalize(data.weather[0].description),
      });
      setCity(data.name);
      try {
        localStorage.setItem('weatherCity', data.name);
      } catch {
        // ignore storage errors
      }
    } catch (error) {
      console.error('Weather Fetch Error:', error);
      setMessage((prev) => ({
        text: prev.text || 'Could not retrieve weather data.',
        className: ERROR_CLASS,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadByCity = useCallback(
    (name, options) => fetchWeather(`q=${encodeURIComponent(name)}`, options),
    [fetchWeather]
  );

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setMessage({
        text: 'Geolocation is not supported. Please enter a city.',
        className: ERROR_CLASS,
      });
      loadByCity(savedCity(), { keepMessage: true });
      onLocation(DEFAULT_COORDS);
      return;
    }

    setMessage({ text: 'Requesting your location permission...', className: INFO_CLASS });

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetchWeather(`lat=${coords.latitude}&lon=${coords.longitude}`);
        onLocation({ lat: coords.latitude, lon: coords.longitude });
      },
      (error) => {
        setMessage({ text: geoErrorMessage(error), className: ERROR_CLASS });
        loadByCity(DEFAULT_CITY, { keepMessage: true });
        onLocation(DEFAULT_COORDS);
      }
    );
  }, [fetchWeather, loadByCity, onLocation]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = city.trim();
    if (name) loadByCity(name);
  };

  return (
    <div className="weather-card">
      <h3 className="weather-title">Current Weather</h3>

      <form className="city-selector" onSubmit={handleSubmit}>
        <input
          type="text"
          id="city-input"
          placeholder="Enter City..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" id="change-city-btn" aria-label="Get weather for city">
          Go
        </button>
      </form>

      <div className="weather-info">
        <div className="weather-item">
          <i className="fas fa-thermometer-half"></i>{' '}
          <span id="weather-temp">{weather ? `${weather.temp}°C` : '--°C'}</span>
        </div>
        <div className="weather-item">
          <i className="fas fa-tint"></i>{' '}
          <span id="weather-humidity">{weather ? `${weather.humidity}%` : '--%'}</span>
        </div>
        <div className="weather-item">
          <i className="fas fa-wind"></i>{' '}
          <span id="weather-wind">{weather ? `${weather.wind} km/h` : '-- km/h'}</span>
        </div>
        <div className="weather-item">
          <i className="fas fa-cloud-sun"></i>{' '}
          <span id="weather-desc">{loading ? 'Loading...' : weather ? weather.desc : '--'}</span>
        </div>
      </div>

      <div id="weather-error" className={message.className}>
        {message.text}
      </div>
    </div>
  );
}
