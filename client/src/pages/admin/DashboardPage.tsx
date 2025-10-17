import { Link } from 'react-router-dom'
import { Users, FileText, BarChart3, TrendingUp, Clock, AlertCircle, CheckCircle, Activity } from 'lucide-react'

export default function DashboardPage() {
  // Mock data - replace with React Query hooks in production
  const stats = {
    totalUsers: 1234,
    activePolicies: 56,
    totalReports: 89,
    policiesUnderReview: 12,
    complianceRate: 94,
    avgResponseTime: 2.5,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-dark-bg)', padding: 'var(--spacing-4)' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-2)' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--color-gray-400)', fontSize: '0.95rem', marginBottom: 'var(--spacing-1)' }}>Real-time overview of SmartBin operations</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>Last updated: {new Date().toLocaleString()}</p>
        </div>

        {/* Main Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
          {/* Total Users Card */}
          <div className="card" style={{ padding: 'var(--spacing-4)', cursor: 'pointer', transition: 'all var(--transition-base)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
              <div>
                <p style={{ color: 'var(--color-gray-400)', fontSize: '0.8rem', fontWeight: '500', marginBottom: 'var(--spacing-1)' }}>Total Users</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>{stats.totalUsers.toLocaleString()}</h3>
              </div>
              <div style={{ padding: 'var(--spacing-2)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--border-radius-md)' }}>
                <Users style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-success)', fontSize: '0.8rem', marginBottom: 'var(--spacing-3)' }}>
              <TrendingUp style={{ width: '0.9rem', height: '0.9rem' }} />
              <span>+12% from last month</span>
            </div>
            <Link
              to="/admin/users"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '500' }}
            >
              View all users →
            </Link>
          </div>

          {/* Active Policies Card */}
          <div className="card" style={{ padding: 'var(--spacing-4)', cursor: 'pointer', transition: 'all var(--transition-base)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
              <div>
                <p style={{ color: 'var(--color-gray-400)', fontSize: '0.8rem', fontWeight: '500', marginBottom: 'var(--spacing-1)' }}>Active Policies</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>{stats.activePolicies}</h3>
              </div>
              <div style={{ padding: 'var(--spacing-2)', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--border-radius-md)' }}>
                <FileText style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-warning)', fontSize: '0.8rem', marginBottom: 'var(--spacing-3)' }}>
              <AlertCircle style={{ width: '0.9rem', height: '0.9rem' }} />
              <span>{stats.policiesUnderReview} under review</span>
            </div>
            <Link
              to="/admin/policies"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--color-success)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '500' }}
            >
              Manage policies →
            </Link>
          </div>

          {/* Reports Card */}
          <div className="card" style={{ padding: 'var(--spacing-4)', cursor: 'pointer', transition: 'all var(--transition-base)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
              <div>
                <p style={{ color: 'var(--color-gray-400)', fontSize: '0.8rem', fontWeight: '500', marginBottom: 'var(--spacing-1)' }}>Total Reports</p>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>{stats.totalReports}</h3>
              </div>
              <div style={{ padding: 'var(--spacing-2)', backgroundColor: 'rgba(30, 64, 175, 0.1)', borderRadius: 'var(--border-radius-md)' }}>
                <BarChart3 style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-secondary)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', color: 'var(--color-success)', fontSize: '0.8rem', marginBottom: 'var(--spacing-3)' }}>
              <TrendingUp style={{ width: '0.9rem', height: '0.9rem' }} />
              <span>+8 this week</span>
            </div>
            <Link
              to="/admin/reports"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-1)', color: 'var(--color-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '500' }}
            >
              View reports →
            </Link>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
          {/* Compliance Rate */}
          <div className="card" style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-50)' }}>Compliance Rate</h3>
              <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-success)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-3)' }}>
              <div>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{stats.complianceRate}%</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', marginTop: 'var(--spacing-1)' }}>Excellent compliance status</p>
              </div>
              <div style={{ flex: 1, height: '6rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 'var(--spacing-3)' }}>
                <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'flex-end', height: '100%' }}>
                  {[65, 72, 78, 85, 90, 94].map((val, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--color-success)',
                        borderTopLeftRadius: '0.2rem',
                        borderTopRightRadius: '0.2rem',
                        height: `${(val / 100) * 100}%`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="card" style={{ padding: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-50)' }}>System Health</h3>
              <Activity style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--color-gray-300)' }}>API Response Time</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600' }}>{stats.avgResponseTime}ms</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--color-dark-border)', borderRadius: '9999px', height: '0.4rem' }}>
                  <div style={{ backgroundColor: 'var(--color-success)', height: '0.4rem', borderRadius: '9999px', width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--color-gray-300)' }}>Database Load</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600' }}>42%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--color-dark-border)', borderRadius: '9999px', height: '0.4rem' }}>
                  <div style={{ backgroundColor: 'var(--color-primary)', height: '0.4rem', borderRadius: '9999px', width: '42%' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--color-gray-300)' }}>Cache Hit Rate</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600' }}>88%</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--color-dark-border)', borderRadius: '9999px', height: '0.4rem' }}>
                  <div style={{ backgroundColor: 'var(--color-secondary)', height: '0.4rem', borderRadius: '9999px', width: '88%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: 'var(--spacing-4)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-gray-50)', marginBottom: 'var(--spacing-3)' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-2)' }}>
            <Link
              to="/admin/policies/new"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-1)', padding: 'var(--spacing-2) var(--spacing-3)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              <FileText style={{ width: '1rem', height: '1rem' }} />
              New Policy
            </Link>
            <Link
              to="/admin/users"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-1)', padding: 'var(--spacing-2) var(--spacing-3)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              <Users style={{ width: '1rem', height: '1rem' }} />
              Manage Users
            </Link>
            <Link
              to="/admin/reports"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-1)', padding: 'var(--spacing-2) var(--spacing-3)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              <BarChart3 style={{ width: '1rem', height: '1rem' }} />
              View Reports
            </Link>
            <Link
              to="/admin/settings"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-1)', padding: 'var(--spacing-2) var(--spacing-3)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              <Clock style={{ width: '1rem', height: '1rem' }} />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}