import { Link } from 'react-router-dom';

export default function UsersPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', padding: 'var(--spacing-6)' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>Users</h1>
      <p style={{ color: 'var(--color-gray-400)' }}>Manage application users.</p>
      <div className="card" style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-4)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)' }}>No users to display.</div>
        <Link to="/admin/users/new" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', textDecoration: 'underline', marginTop: 'var(--spacing-2)', display: 'inline-block' }}>Invite user</Link>
      </div>
    </div>
  );
}
