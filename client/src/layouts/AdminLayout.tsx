import React from "react";
import { Outlet, Link } from "react-router-dom";

const Sidebar: React.FC = () => (
  <aside
    style={{
      width: 240,
      background: "#0f172a",
      color: "#fff",
      padding: 16,
      minHeight: "100vh",
    }}
  >
    <h2 style={{ marginTop: 0 }}>SmartBin Admin</h2>
    <nav>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>
          <Link to="/admin/dashboard" style={{ color: "#cbd5e1" }}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/admin/policies" style={{ color: "#cbd5e1" }}>
            Policies
          </Link>
        </li>
        <li>
          <Link to="/admin/reports" style={{ color: "#cbd5e1" }}>
            Reports
          </Link>
        </li>
        <li>
          <Link to="/admin/users" style={{ color: "#cbd5e1" }}>
            Users
          </Link>
        </li>
      </ul>
    </nav>
  </aside>
);

const Header: React.FC = () => (
  <header
    style={{
      height: 64,
      background: "#0b1220",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      justifyContent: "space-between",
    }}
  >
    <div>Admin Panel</div>
    <div>
      <Link to="/admin/settings" style={{ color: "#cbd5e1", marginRight: 12 }}>
        Settings
      </Link>
      <button
        style={{
          background: "transparent",
          color: "#cbd5e1",
          border: "1px solid #2b3440",
          padding: "6px 10px",
          borderRadius: 6,
        }}
      >
        Logout
      </button>
    </div>
  </header>
);

const AdminLayout: React.FC = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header />
        <main
          style={{
            padding: 24,
            background: "#f8fafc",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
