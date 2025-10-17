import type React from "react";
import { Outlet, Link } from "react-router-dom";
import {
  LucideHome,
  LucideCamera,
  LucideClipboardList,
  LucideBell,
} from "lucide-react";

const Topbar: React.FC<{ role?: string }> = () => (
  <header className="navbar">
    <div className="navbar-container">
      <Link to="/" className="navbar-brand">
        SmartBin
      </Link>
      <nav className="navbar-menu">
        <li className="navbar-item">
          <Link to="/profile" className="navbar-link">
            Profile
          </Link>
        </li>
        <li className="navbar-item">
          <Link to="/help" className="navbar-link">
            Help
          </Link>
        </li>
        <li className="navbar-item">
          <Link to="/login" className="btn btn-secondary btn-sm">
            Login
          </Link>
        </li>
        <li className="navbar-item">
          <Link to="/payment" className="btn btn-secondary btn-sm">
            Manage Payment
          </Link>
        </li>
      </nav>
    </div>
  </header>
);

const BottomNav: React.FC = () => (
  <nav
    style={{
      height: "5rem",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(8px)",
      borderTop: `var(--border-width-base) solid rgba(16, 185, 129, 0.3)`,
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      boxShadow: "var(--shadow-lg)",
    }}
  >
    <Link
      to="/home"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "rgb(45, 212, 191)",
        textDecoration: "none",
        fontWeight: "var(--font-weight-medium)",
        transition: "all var(--transition-base)",
        padding: `var(--spacing-2) var(--spacing-6)`,
        borderRadius: "var(--border-radius-lg)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
      aria-label="Go to home"
    >
      <LucideHome
        className="w-6 h-6 mb-1"
        style={{ color: "rgb(16, 185, 129)" }}
      />
      <span style={{ fontSize: "var(--font-size-sm)" }}>Home</span>
    </Link>
    <Link
      to="/scan"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "rgb(45, 212, 191)",
        textDecoration: "none",
        fontWeight: "var(--font-weight-medium)",
        transition: "all var(--transition-base)",
        padding: `var(--spacing-2) var(--spacing-6)`,
        borderRadius: "var(--border-radius-lg)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
      aria-label="Scan now"
    >
      <LucideCamera
        className="w-6 h-6 mb-1"
        style={{ color: "rgb(45, 212, 191)" }}
      />
      <span style={{ fontSize: "var(--font-size-sm)" }}>Scan</span>
    </Link>
    <Link
      to="/requests"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "rgb(45, 212, 191)",
        textDecoration: "none",
        fontWeight: "var(--font-weight-medium)",
        transition: "all var(--transition-base)",
        padding: `var(--spacing-2) var(--spacing-6)`,
        borderRadius: "var(--border-radius-lg)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
      aria-label="View requests"
    >
      <LucideClipboardList
        className="w-6 h-6 mb-1"
        style={{ color: "rgb(34, 197, 234)" }}
      />
      <span style={{ fontSize: "var(--font-size-sm)" }}>Requests</span>
    </Link>
    <Link
      to="/notifications"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "rgb(45, 212, 191)",
        textDecoration: "none",
        fontWeight: "var(--font-weight-medium)",
        transition: "all var(--transition-base)",
        padding: `var(--spacing-2) var(--spacing-6)`,
        borderRadius: "var(--border-radius-lg)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "transparent")
      }
      aria-label="Check notifications"
    >
      <LucideBell
        className="w-6 h-6 mb-1"
        style={{ color: "rgb(59, 130, 246)" }}
      />
      <span style={{ fontSize: "var(--font-size-sm)" }}>Notifications</span>
    </Link>
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
      <main
        style={{
          flex: 1,
          padding: "var(--spacing-10)",
          backgroundColor: "var(--color-dark-bg)",
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default UserLayout;
