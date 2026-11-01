import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Layout from './components/Layout.jsx';
import Loader from './components/Loader.jsx';
import Home from './pages/Home.jsx';
import Toolkit from './pages/Toolkit.jsx';
import News from './pages/News.jsx';
import Support from './pages/Support.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <Loader />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="toolkit" element={<Toolkit />} />
            <Route path="news" element={<News />} />
            <Route path="support" element={<Support />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
