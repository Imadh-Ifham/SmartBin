import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { PolicyAPI } from "../api/policyApi";
import type { Policy, PolicyFeedback, PolicyStakeholderType, PolicyComplianceStatus, PolicyStatus } from "../types";

const statusOptions: PolicyStatus[] = ["Draft", "UnderReview", "Active", "Retired", "Archived"];
const complianceOptions: PolicyComplianceStatus[] = ["Compliant", "NonCompliant", "Pending"];
const stakeholderOptions: PolicyStakeholderType[] = ["resident", "business", "staff"];

interface PolicyFormProps {
  onSubmit: (data: Partial<Policy>) => Promise<void>;
  loading: boolean;
}

const PolicyForm: React.FC<PolicyFormProps> = ({ onSubmit, loading }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/admin") ? "/admin/policies" : "/policies";

  const [form, setForm] = useState<Partial<Policy>>({
    title: "",
    description: "",
    category: "",
    ministry: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    status: "Draft",
    complianceStatus: "Compliant",
  });
  const [existingFeedback, setExistingFeedback] = useState<PolicyFeedback[]>([]);
  const [feedbackStakeholder, setFeedbackStakeholder] = useState<PolicyStakeholderType>("resident");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    PolicyAPI.getById(id)
      .then((data: unknown) => {
        // Only set form if data is a valid Policy object, otherwise do nothing
        if (data && typeof data === "object" && "title" in data && "description" in data) {
          const policy = data as Policy;
          setForm({
            title: policy.title,
            description: policy.description,
            category: policy.category,
            ministry: policy.ministry,
            effectiveDate: policy.effectiveDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
            status: policy.status ?? "Draft",
            complianceStatus: policy.complianceStatus ?? "Compliant",
          });
          setExistingFeedback(policy.feedback ?? []);
        }
      })
      .catch((err: unknown) => {
        setError(getErrMessage(err));
      });
  }, [id]);

  // generic-safe change handler: preserves key/value types without `any`
  const change = <K extends keyof Policy>(key: K, value: Policy[K] | undefined) =>
    setForm((prev) => ({ ...prev, [key]: value } as Partial<Policy>));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: Partial<Policy> = {
        ...form,
        feedback:
          feedbackMessage.trim().length > 0
            ? [{ stakeholderType: feedbackStakeholder, message: feedbackMessage.trim() }]
            : undefined,
      };
      await onSubmit(payload);
      navigate(basePath);
    } catch (err: unknown) {
      setError(getErrMessage(err, "Failed to save policy"));
    }
  };

  function getErrMessage(err: unknown, fallback = "Error") {
    type AxiosLike = { response?: { data?: { error?: string } }; message?: string };
    const e = err as AxiosLike | null;
    if (!e) return fallback;
    if (e.response && e.response.data && typeof e.response.data.error === 'string') return e.response.data.error;
    if (typeof e.message === 'string') return e.message;
    return fallback;
  }

  const headline = id ? "Edit Policy" : "Create Policy";
  const subline = id
    ? "Update policy details, compliance status, and feedback."
    : "Create a new policy record with essential details.";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-dark-bg)', padding: 'var(--spacing-8)' }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
        <header style={{ marginBottom: 'var(--spacing-6)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-gray-50)' }}>{headline}</h2>
          <p style={{ marginTop: 'var(--spacing-1)', fontSize: '0.875rem', color: 'var(--color-gray-400)' }}>{subline}</p>
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

        <div style={{ display: 'grid', gap: 'var(--spacing-6)', gridTemplateColumns: '2fr 1fr' }}>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-dark-surface)', padding: 'var(--spacing-6)' }}
          >
            <div style={{ display: 'grid', gap: 'var(--spacing-4)', gridTemplateColumns: '1fr 1fr' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Title</span>
                <input
                  name="title"
                  required
                  placeholder="Policy title"
                  value={form.title ?? ""}
                  onChange={(e) => change("title", e.target.value)}
                  className="form-control"
                  aria-label="Policy title"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Ministry</span>
                <input
                  name="ministry"
                  placeholder="Responsible ministry"
                  value={form.ministry ?? ""}
                  onChange={(e) => change("ministry", e.target.value)}
                  className="form-control"
                  aria-label="Responsible ministry"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Category</span>
                <input
                  name="category"
                  placeholder="Category"
                  value={form.category ?? ""}
                  onChange={(e) => change("category", e.target.value)}
                  className="form-control"
                  aria-label="Policy category"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Effective Date</span>
                <input
                  type="date"
                  name="effectiveDate"
                  value={form.effectiveDate ?? ""}
                  onChange={(e) => change("effectiveDate", e.target.value)}
                  className="form-control"
                  aria-label="Effective date"
                />
              </label>
            </div>
            <div style={{ display: 'grid', gap: 'var(--spacing-4)', gridTemplateColumns: '1fr 1fr' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-gray-400)' }}>Status</span>
                <select
                  name="status"
                  value={form.status ?? "Draft"}
                  onChange={(e) => change("status", e.target.value as PolicyStatus)}
                  className="form-control"
                  aria-label="Policy status"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-600">Compliance Status</span>
                <select
                  name="complianceStatus"
                  value={form.complianceStatus ?? "Compliant"}
                  onChange={(e) => change("complianceStatus", e.target.value as PolicyComplianceStatus)}
                  className="rounded-md border border-gray-200 p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  aria-label="Compliance status"
                >
                  {complianceOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-600">Description</span>
              <textarea
                required
                rows={6}
                name="description"
                placeholder="Provide context, objectives, and key directives..."
                value={form.description ?? ""}
                onChange={(e) => change("description", e.target.value)}
                className="rounded-md border border-gray-200 p-3 text-sm leading-relaxed focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                aria-label="Policy description"
              />
            </label>
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-700">Add Feedback (Optional)</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  value={feedbackStakeholder}
                  onChange={(e) => setFeedbackStakeholder(e.target.value as PolicyStakeholderType)}
                  className="rounded-md border border-gray-200 p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  aria-label="Stakeholder type"
                >
                  {stakeholderOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  placeholder="Capture stakeholder notes or observations…"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="md:col-span-2 rounded-md border border-gray-200 p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  aria-label="Feedback message"
                />
              </div>
              <p className="text-xs text-gray-500">
                Feedback added here is appended to the history once the policy is saved.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
                aria-label={id ? "Update policy" : "Create policy"}
              >
                {loading ? "Saving..." : id ? "Update Policy" : "Create Policy"}
              </button>
              <button
                type="button"
                onClick={() => navigate(basePath)}
                className="rounded-md border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Cancel"
              >
                Cancel
              </button>
            </div>
          </form>
          <aside className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Quick Summary</h3>
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                <li>
                  <span className="font-medium text-gray-500">Status:</span> {form.status ?? "Draft"}
                </li>
                <li>
                  <span className="font-medium text-gray-500">Compliance:</span> {form.complianceStatus ?? "Compliant"}
                </li>
                <li>
                  <span className="font-medium text-gray-500">Effective:</span>{" "}
                  {form.effectiveDate ? new Date(form.effectiveDate).toLocaleDateString() : "TBD"}
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-700">Existing Feedback</h4>
              {existingFeedback.length > 0 ? (
                <ul className="mt-3 space-y-2 text-xs text-gray-600">
                  {existingFeedback.map((fb, idx) => (
                    <li key={`${fb.stakeholderType}-${idx}`}>
                      <strong className="capitalize text-gray-700">{fb.stakeholderType}</strong>: {fb.message || "—"}
                      <span className="ml-1 text-gray-400">
                        ({fb.date ? new Date(fb.date).toLocaleString() : "recent"})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-gray-500">No feedback captured yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PolicyForm;