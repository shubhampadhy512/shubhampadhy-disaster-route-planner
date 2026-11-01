import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  const { pathname } = useLocation();

  // Start every page at the top when navigating
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div id="page-content">
        <Header />
        <Outlet />
      </div>
      <Footer detailed={pathname === '/'} />
    </>
  );
}
