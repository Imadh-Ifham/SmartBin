import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

const DesktopTopNav: React.FC = () => {
  const location = useLocation();
  const navs = [
    { name: "Tracker", to: "/collector/tracker" },
    { name: "Scanner", to: "/collector/scanner" },
  ];

  return (
    <header className="hidden md:flex items-center justify-between bg-white shadow-md px-6 py-3">
      <div className="text-2xl font-bold text-gray-900">SmartBin Collector</div>
      <nav className="flex gap-4">
        {navs.map((nav) => (
          <Link
            key={nav.to}
            to={nav.to}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              location.pathname === nav.to
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {nav.name}
          </Link>
        ))}
      </nav>
    </header>
  );
};

const MobileTopNav: React.FC = () => (
  <header className="md:hidden bg-blue-600 text-white py-3 text-center text-lg font-semibold shadow-sm">
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
    <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 shadow-md">
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
          <span className="text-lg">{nav.icon}</span>
          {nav.name}
        </Link>
      ))}
    </nav>
  );
};

const CollectorLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top nav */}
      <DesktopTopNav />
      <MobileTopNav />

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom nav only for mobile */}
      <BottomNav />
    </div>
  );
};

export default CollectorLayout;
