import React, { useState } from "react";
import type { Policy } from "../types";

interface Props {
  onChange: (filters: {
    q?: string;
    category?: string;
    ministry?: string;
    status?: string;
    complianceStatus?: string;
  }) => void;
  policies?: Policy[];
}

const statuses = ["Draft", "UnderReview", "Active", "Retired", "Archived"];
const complianceStatuses = ["Compliant", "NonCompliant", "Pending"];

export const PolicyFilter: React.FC<Props> = ({ onChange, policies = [] }) => {
  const [filters, setFilters] = useState<{
    q?: string;
    category?: string;
    ministry?: string;
    status?: string;
    complianceStatus?: string;
  }>({
    q: "",
    category: "",
    ministry: "",
    status: "",
    complianceStatus: "",
  });

  // Derive unique options from actual data
  const categories = Array.from(new Set(policies.map((p) => p.category).filter(Boolean)));
  const ministries = Array.from(new Set(policies.map((p) => p.ministry).filter(Boolean)));

  const handleReset = () => {
    setFilters({
      q: "",
      category: "",
      ministry: "",
      status: "",
      complianceStatus: "",
    });
    onChange({
      q: "",
      category: "",
      ministry: "",
      status: "",
      complianceStatus: "",
    });
  };

  const applyFilters = (next: Partial<typeof filters>) => {
    const merged = { ...filters, ...next };
    const sanitized = Object.fromEntries(
      Object.entries(merged).filter(([, value]) => value !== undefined && value !== "")
    ) as typeof filters;
    setFilters(sanitized);
    onChange(sanitized);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span className="font-semibold">Refine results</span>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        >
          Clear filters
        </button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <label htmlFor="filter-q" className="sr-only">Search policies</label>
          <input
            id="filter-q"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Search by title or keyword..."
            value={filters.q}
            onChange={(e) => applyFilters({ q: e.target.value || undefined })}
          />
        </div>
        <label htmlFor="filter-category" className="sr-only">Filter by category</label>
        <select
          id="filter-category"
          onChange={(e) => applyFilters({ category: e.target.value || undefined })}
          value={filters.category}
          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label htmlFor="filter-ministry" className="sr-only">Filter by ministry</label>
        <select
          id="filter-ministry"
          onChange={(e) => applyFilters({ ministry: e.target.value || undefined })}
          value={filters.ministry}
          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Ministry</option>
          {ministries.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <label htmlFor="filter-status" className="sr-only">Filter by status</label>
        <select
          id="filter-status"
          onChange={(e) => applyFilters({ status: e.target.value || undefined })}
          value={filters.status}
          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Status</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label htmlFor="filter-compliance" className="sr-only">Filter by compliance status</label>
        <select
          id="filter-compliance"
          onChange={(e) => applyFilters({ complianceStatus: e.target.value || undefined })}
          value={filters.complianceStatus}
          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Compliance</option>
          {complianceStatuses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PolicyFilter;
