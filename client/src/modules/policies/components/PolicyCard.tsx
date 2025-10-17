import React from "react";
import type { Policy } from "../../policies/types";

interface Props {
  policy: Policy;
  onView?: (id?: string) => void;
  onEdit?: (id?: string) => void;
}

const complianceBadge = (status?: Policy["complianceStatus"]) => {
  switch (status) {
    case "Compliant":
      return "bg-green-100 text-green-700";
    case "NonCompliant":
      return "bg-red-100 text-red-700";
    case "Pending":
    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

const statusBadge = (status?: Policy["status"]) => {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700";
    case "UnderReview":
      return "bg-sky-100 text-sky-700";
    case "Retired":
      return "bg-slate-200 text-slate-700";
    case "Archived":
      return "bg-zinc-100 text-zinc-600";
    case "Draft":
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const formatUpdatedAt = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(parsed);
};

export const PolicyCard: React.FC<Props> = ({ policy, onView, onEdit }) => {
  const updatedLabel = formatUpdatedAt(policy.updatedAt);
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-400 opacity-80" />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{policy.title}</h3>
            <p className="text-xs text-slate-500">
              {policy.ministry || "—"} {policy.category ? "• " + policy.category : ""}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            v{policy.version ?? 1}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className={`rounded-full px-2.5 py-1 ${statusBadge(policy.status)}`}>
            {policy.status}
          </span>
          <span className={`rounded-full px-2.5 py-1 ${complianceBadge(policy.complianceStatus)}`}>
            {policy.complianceStatus || "Pending"}
          </span>
          {policy.feedback?.length ? (
            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-slate-500">
              {policy.feedback.length} feedback
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-700 line-clamp-3">{policy.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => onView?.(policy._id)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            View details
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit?.(policy._id)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Edit policy
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">{updatedLabel}</p>
      </div>
    </div>
  );
};
