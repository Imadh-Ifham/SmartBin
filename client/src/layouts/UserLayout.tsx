import React from "react";
import { Outlet, Link } from "react-router-dom";

const Topbar: React.FC<{ role?: string }> = ({ role }) => (
  <header
    style={{
      height: 56,
      background: "#ffffff",
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      boxShadow: "0 1px 0 rgba(15,23,42,0.04)",
      justifyContent: "space-between",
    }}
  >
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ fontWeight: 600 }}>SmartBin</div>
      {role && <div style={{ color: "#6b7280", fontSize: 13 }}>({role})</div>}
    </div>
    <nav>
      <Link to="/profile" style={{ marginRight: 12, color: "#374151" }}>
        Profile
      </Link>
      <Link to="/help" style={{ color: "#374151" }}>
        Help
      </Link>
    </nav>
  </header>
);

const BottomNav: React.FC = () => (
  <nav
    style={{
      height: 56,
      borderTop: "1px solid #e6eef8",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
    }}
  >
    <Link to="/home">Home</Link>
    <Link to="/scan">Scan</Link>
    <Link to="/requests">Requests</Link>
    <Link to="/notifications">Notifications</Link>
  </nav>
);

const UserLayout: React.FC<{ role?: "collector" | "resident" }> = ({
  role = "resident",
}) => {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Topbar role={role} />
      <main style={{ flex: 1, padding: 16, background: "#f1f5f9" }}>
        <Outlet />
      </main>
      {/* collectors may prefer quick nav, residents too - keep simple for now */}
      <BottomNav />
    </div>
  );
};

export default UserLayout;
