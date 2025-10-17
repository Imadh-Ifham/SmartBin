export default function ReportsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', padding: 'var(--spacing-6)' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>Reports</h1>
      <p style={{ color: 'var(--color-gray-400)' }}>System reports and export tools.</p>
      <div className="card" style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-4)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)' }}>No reports available.</div>
      </div>
    </div>
  );
}
