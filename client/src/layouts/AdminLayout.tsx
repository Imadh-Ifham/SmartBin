import React, { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import axiosInstance from "../config/axiosInstance";

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <aside 
    className="sidebar" 
    style={{
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease-in-out',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: '16rem',
      zIndex: 40,
      backgroundColor: 'var(--color-dark-surface)',
      boxShadow: isOpen ? 'var(--shadow-lg)' : 'none'
    }}
  >
    <div style={{ padding: 'var(--spacing-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>SmartBin Admin</h2>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--color-gray-400)', 
            cursor: 'pointer',
            padding: 'var(--spacing-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>
      <nav>
      <ul className="sidebar-menu">
        <li className="sidebar-menu-item">
          <Link to="/admin/dashboard" className="sidebar-menu-link">
            Dashboard
          </Link>
        </li>
        <li className="sidebar-menu-item">
          <Link to="/admin/policies" className="sidebar-menu-link">
            Policies
          </Link>
        </li>
        <li className="sidebar-menu-item">
          <Link to="/admin/reports" className="sidebar-menu-link">
            Reports
          </Link>
        </li>
        <li className="sidebar-menu-item">
          <Link to="/admin/users" className="sidebar-menu-link">
            Users
          </Link>
        </li>
      </ul>
    </nav>
    </div>
  </aside>
);

const Header: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Admin";

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    
    // Reset axios headers
    if (axiosInstance.defaults?.headers?.Authorization) {
      delete axiosInstance.defaults.headers.Authorization;
    }
    
    // Redirect to login
    navigate("/login", { replace: true });
  };

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-4)', backgroundColor: 'var(--color-gray-900)', color: 'white', borderBottom: `var(--border-width-base) solid var(--color-gray-700)`, boxShadow: 'var(--shadow-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: 'var(--spacing-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--border-radius-base)',
            transition: 'background-color var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>Admin Panel</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)' }}>
          Welcome, <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'white' }}>{username}</span>
        </span>
        <Link to="/admin/settings" style={{ color: 'var(--color-gray-400)', textDecoration: 'none', transition: 'color var(--transition-fast)' }}>
          Settings
        </Link>
        <button className="btn btn-danger btn-sm" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
};

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', maxHeight: '100vh', backgroundColor: 'var(--color-gray-50)', overflow: 'hidden' }}>
      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
