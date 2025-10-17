export interface PerformanceReport {
  policyId: string;
  performanceScore: number;
  monthly: { month: string; score: number }[];
}

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
