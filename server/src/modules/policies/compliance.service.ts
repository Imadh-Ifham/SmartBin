export interface ComplianceResult {
  compliant: boolean;
  issues: string[];
}

export interface ComplianceStrategy {
  region: string;
  check(policy: any): Promise<ComplianceResult>;
}

class SriLankaStrategy implements ComplianceStrategy {
  region = "SriLanka";
  async check(policy: any) {
    const issues: string[] = [];
    // Regional compliance rules
    if (!policy.title || String(policy.title).trim().length < 5) {
      issues.push("Title is too short for Sri Lanka regulations");
    }
    if (!policy.effectiveDate || isNaN(new Date(policy.effectiveDate).getTime())) {
      issues.push("Effective date is required and must be a valid date");
    }
    if (!policy.ministry) issues.push("Ministry must be declared for Sri Lanka region");

    return { compliant: issues.length === 0, issues };
  }
}

export class ComplianceService {
  private strategies: ComplianceStrategy[] = [];

  constructor() {
    // register built-in strategies
    this.register(new SriLankaStrategy());
  }

  register(strategy: ComplianceStrategy) {
    this.strategies.push(strategy);
  }

  async check(policy: any, region?: string) {
    // choose strategy by region if provided
    const strategy = region
      ? this.strategies.find((s) => s.region.toLowerCase() === String(region).toLowerCase())
      : this.strategies[0];
    if (!strategy) return { compliant: true, issues: [] };
    return strategy.check(policy);
  }
}

export const complianceService = new ComplianceService();
