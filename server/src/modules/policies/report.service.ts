export interface PerformanceReport {
  policyId: string;
  performanceScore: number;
  monthly: { month: string; score: number }[];
}

/**
 * ReportService
 *
 * Provides performance and violation report data for policies. In this project the
 * service returns deterministic mocked results to keep the module self-contained
 * for tests. In production this would be replaced by a real reporting/analysis service.
 *
 * Responsibilities:
 * - getPerformanceForPolicy(policyId): returns a PerformanceReport used by the
 *   PolicyService.enrichPolicy method to attach a performanceReport to each policy.
 * - getViolationsForPolicy(policyId): returns a list of violations used by
 *   PolicyService.enrichPolicy.
 *
 * Pattern: this is a simple service object (Service Layer). It isolates reporting
 * logic from policy business logic and can be swapped/mocked in tests.
 */
export class ReportService {
  // Return a mocked performance report for a policy
  async getPerformanceForPolicy(policyId: string): Promise<PerformanceReport> {
    // deterministic mock based on policyId hash length
    const base = (policyId || "").length % 100;
    const score = 60 + (base % 40);
    const monthly = ["2025-04","2025-05","2025-06","2025-07","2025-08","2025-09"].map((m, i) => ({ month: m, score: Math.max(10, score - i) }));
    return { policyId, performanceScore: score, monthly };
  }

  // Return mocked violations list
  async getViolationsForPolicy(policyId: string) {
    if (!policyId) return [];
    // simple mock: policies with odd length id have a violation
    if ((policyId.length % 2) === 1) return ["Sample violation: late review"];
    return [];
  }
}

export const reportService = new ReportService();
