import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

const DesktopTopNav: React.FC = () => {
  const location = useLocation();
  const navs = [
    { name: "Tracker", to: "/collector/tracker" },
    { name: "Scanner", to: "/collector/scanner" },
  ];

  return (
    <header className="navbar" style={{ display: 'none' }}>
      <div className="navbar-container">
        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>SmartBin Collector</div>
        <nav className="navbar-menu">
          {navs.map((nav) => (
            <li key={nav.to} className="navbar-item">
              <Link to={nav.to} className={`navbar-link ${location.pathname === nav.to ? 'active' : ''}`}>
                {nav.name}
              </Link>
            </li>
          ))}
        </nav>
      </div>
    </header>
  );
};

const MobileTopNav: React.FC = () => (
  <header style={{ backgroundColor: 'var(--color-secondary)', color: 'white', padding: 'var(--spacing-3)', textAlign: 'center', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', boxShadow: 'var(--shadow-sm)' }}>
    SmartBin Collector
  </header>
);

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navs = [
    { name: "Map", to: "/home", icon: "🗺️" },
    { name: "Tracker", to: "/tracker", icon: "📍" },
    { name: "Scanner", to: "/scanner", icon: "📷" },
  ];

  return (
    <nav style={{ display: 'none', position: 'fixed', bottom: 0, width: '100%', backgroundColor: 'white', borderTop: `var(--border-width-base) solid var(--color-gray-200)`, justifyContent: 'space-around', alignItems: 'center', height: '4rem', boxShadow: 'var(--shadow-md)' }}>
      {navs.map((nav) => (
        <Link
          key={nav.to}
          to={nav.to}
          className={`flex flex-col items-center justify-center text-sm font-medium px-3 py-1 rounded-full transition-colors ${
            location.pathname === nav.to
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span style={{ fontSize: 'var(--font-size-lg)' }}>{nav.icon}</span>
          {nav.name}
        </Link>
      ))}
    </nav>
  );
};

const CollectorLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-dark-bg)' }}>
      {/* Top nav */}
      <DesktopTopNav />
      <MobileTopNav />

      {/* Main content */}
      <main style={{ flex: 1, padding: 'var(--spacing-4)', overflowY: 'auto' }}>
        <Outlet />
      </main>

      {/* Bottom nav only for mobile */}
      <BottomNav />
    </div>
  );
};

export default CollectorLayout;
