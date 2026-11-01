# Global Disaster Alert and Evacuation Route Planner (React)

React + Vite version of the original HTML/CSS/JS project. The Login / admin page has been removed.

## Run

```bash
npm install
npm run dev      # development
npm run build    # production build in dist/
```

## API keys

Copy `.env.example` to `.env` and fill in your keys:

- `VITE_WEATHER_API_KEY` - OpenWeatherMap (weather card)
- `VITE_NEWS_API_KEY` - NewsData.io (news page)

## Structure

```
src/
  components/  Header, Footer, Layout, Loader, MapView (Leaflet), WeatherCard
  context/     ThemeContext (light/dark mode)
  pages/       Home, Toolkit, News, Support
  styles/      original project.css plus the per-page styles
  data/        footer social links
```
