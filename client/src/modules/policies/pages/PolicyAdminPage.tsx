import React, { useCallback, useEffect, useState } from "react";
import PolicyForm from "../components/PolicyForm";
import { createPolicy, deletePolicy, getPolicies, approvePolicy } from "../api/policyApi";
import type { Policy } from "../types";

const PolicyAdminPage: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(() => {
    setError(null);
    getPolicies()
      .then((res) => {
        if (res && typeof res === 'object' && 'policies' in res) {
          const maybe = res as { policies?: unknown };
          setPolicies(Array.isArray(maybe.policies) ? (maybe.policies as Policy[]) : []);
        } else if (Array.isArray(res)) {
          setPolicies(res as Policy[]);
        } else {
          setPolicies([]);
        }
      })
      .catch((err: unknown) => setError(getErrMessage(err, "Failed to load policies")));
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleCreate = async (data: Partial<Policy>) => {
    setLoading(true);
    setError(null);
    try {
      await createPolicy(data);
      fetchPolicies();
    } catch (err: unknown) {
      setError(getErrMessage(err, "Failed to create policy"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this policy?")) return;
    setError(null);
    try {
      await deletePolicy(id);
      setPolicies((prev) => prev.filter((policy) => policy._id !== id));
    } catch (err: unknown) {
      setError(getErrMessage(err, "Failed to delete policy"));
    }
  };

  function getErrMessage(err: unknown, fallback = 'Error') {
    type AxiosLike = { response?: { data?: { error?: string } }; message?: string };
    const e = err as AxiosLike | null;
    if (!e) return fallback;
    return e?.response?.data?.error || e?.message || fallback;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-dark-bg)', padding: 'var(--spacing-8)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <header style={{ marginBottom: 'var(--spacing-8)' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>Manage Policies</h1>
          <p style={{ marginTop: 'var(--spacing-2)', fontSize: '0.875rem', color: 'var(--color-gray-400)' }}>Create, review, and manage policy records efficiently.</p>
        </header>

        {error && (
          <div
            style={{ marginBottom: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-error-dark)', padding: 'var(--spacing-4)', fontSize: '0.875rem', color: 'var(--color-error)' }}
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <section style={{ marginBottom: 'var(--spacing-10)' }}>
          <PolicyForm onSubmit={handleCreate} loading={loading} />
        </section>

        <section>
          <h2 style={{ marginBottom: 'var(--spacing-4)', fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-gray-50)' }}>Existing Policies</h2>
          {loading ? (
            <div style={{ display: 'grid', gap: 'var(--spacing-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{ height: '6rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-dark-surface)' }}
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : (
            <ul style={{ display: 'grid', gap: 'var(--spacing-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {policies.map((policy) => (
                <li
                  key={policy._id}
                  style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-dark-surface)', padding: 'var(--spacing-4)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'box-shadow 0.2s' }}
                >
                  <div style={{ marginBottom: 'var(--spacing-3)' }}>
                    <p style={{ fontWeight: '500', color: 'var(--color-gray-50)' }}>{policy.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: 'var(--spacing-1)' }}>
                      {policy.category || "Uncategorized"} •{" "}
                      <span
                        style={{
                          display: 'inline-block',
                          borderRadius: '9999px',
                          paddingLeft: 'var(--spacing-2)',
                          paddingRight: 'var(--spacing-2)',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: policy.status === "Active" ? '#10b98180' : 'var(--color-dark-bg)',
                          color: policy.status === "Active" ? 'var(--color-primary)' : 'var(--color-gray-400)'
                        }}
                      >
                        {policy.status}
                      </span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                    <a
                      href={`/admin/policies/${policy._id}`}
                      style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingLeft: 'var(--spacing-3)', paddingRight: 'var(--spacing-3)', paddingTop: '0.25rem', paddingBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-primary)', textDecoration: 'none', transition: 'background-color 0.2s', cursor: 'pointer' }}
                      aria-label={`View policy ${policy.title}`}
                    >
                      View
                    </a>
                    <a
                      href={`/admin/policies/${policy._id}/edit`}
                      style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingLeft: 'var(--spacing-3)', paddingRight: 'var(--spacing-3)', paddingTop: '0.25rem', paddingBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-primary)', textDecoration: 'none', transition: 'background-color 0.2s', cursor: 'pointer' }}
                      aria-label={`Edit policy ${policy.title}`}
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => handleDelete(policy._id)}
                      style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingLeft: 'var(--spacing-3)', paddingRight: 'var(--spacing-3)', paddingTop: '0.25rem', paddingBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#ef4444', border: 'none', transition: 'background-color 0.2s', cursor: 'pointer' }}
                      aria-label={`Delete policy ${policy.title}`}
                    >
                      Delete
                    </button>
                    <button
                      onClick={async () => {
                        if (!policy._id) return;
                        try {
                          await approvePolicy(policy._id);
                          setPolicies((prev) => prev.map((p) => (p._id === policy._id ? { ...p, status: 'Active' } : p)));
                        } catch (err: unknown) {
                          alert('Approve failed');
                        }
                      }}
                      style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(168, 85, 247, 0.1)', paddingLeft: 'var(--spacing-3)', paddingRight: 'var(--spacing-3)', paddingTop: '0.25rem', paddingBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#a855f7', border: 'none', transition: 'background-color 0.2s', cursor: 'pointer' }}
                      aria-label={`Approve policy ${policy.title}`}
                    >
                      Approve
                    </button>
                  </div>
                </li>
              ))}
              {policies.length === 0 && (
                <li style={{ gridColumn: '1 / -1', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-dark-surface)', padding: 'var(--spacing-6)', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-gray-400)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  No policies available. Create a new policy to get started.
                </li>
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default PolicyAdminPage;