import { useEffect, useState } from 'react';
import '../styles/content-pages.css';
import '../styles/news.css';

const API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const QUERY = 'disaster OR flood OR cyclone OR earthquake OR landslide';
const NEWS_URL = `https://newsdata.io/api/1/news?apikey=${API_KEY}&country=in&language=en&q=${encodeURIComponent(QUERY)}`;

export default function News() {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    const controller = new AbortController();

    async function fetchIndiaDisasterNews() {
      try {
        const response = await fetch(NEWS_URL, { signal: controller.signal });
        const data = await response.json();
        if (!Array.isArray(data.results)) throw new Error('Unexpected API response');

        setArticles(data.results.slice(0, 5));
        setStatus('ready');
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('News Fetch Error:', error);
        setStatus('error');
      }
    }

    fetchIndiaDisasterNews();
    return () => controller.abort();
  }, []);

  return (
    <main className="news-page">
      <div className="news-wrap">
        <div className="news-ticker" aria-label="News coverage">
          <span className="news-ticker-label">
            <i className="fas fa-signal" aria-hidden="true"></i>
            Live coverage
          </span>
          <span className="news-ticker-copy">
            Disaster response · Weather events · Preparedness updates
          </span>
        </div>

        <section id="news" className="news-hero" aria-labelledby="news-title">
          <div className="news-hero-copy">
            <p className="page-eyebrow">
              <i className="fas fa-newspaper" aria-hidden="true"></i>
              Situation updates
            </p>
            <h1 id="news-title">Disaster news &amp; updates</h1>
            <p>
              Follow the latest reporting on disasters, emergency response, and community
              preparedness from across India.
            </p>
          </div>
          <div className="news-hero-mark" aria-hidden="true">
            <i className="fas fa-earth-asia"></i>
          </div>
        </section>

        <section aria-labelledby="news-feed-title">
          <div className="news-feed-heading">
            <div>
              <h2 id="news-feed-title">Latest headlines</h2>
              <p>Recent reports selected for disaster and preparedness coverage.</p>
            </div>
          </div>
          <div id="news-feed" className="news-feed" aria-live="polite">
            {status === 'loading' && (
              <p className="news-state">
                <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                Loading the latest headlines…
              </p>
            )}
            {status === 'error' && (
              <p className="news-state" role="status">
                <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
                News updates are temporarily unavailable. Please try again later.
              </p>
            )}
            {status === 'ready' && articles.length === 0 && (
              <p className="news-state">
                <i className="fas fa-newspaper" aria-hidden="true"></i>
                No recent headlines are available right now.
              </p>
            )}
            {status === 'ready' &&
              articles.map((article) => (
                <article className="news-card" key={article.article_id || article.link}>
                  <h3>
                    <a href={article.link} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h3>
                  <p>{article.description || ''}</p>
                  <time dateTime={article.pubDate}>
                    {new Date(article.pubDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                </article>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
