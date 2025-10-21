import { ComplianceService } from '../compliance.service';

describe('ComplianceService', () => {
  const service = new ComplianceService();

  test('returns compliant for a valid Sri Lanka policy', async () => {
    const policy = {
      title: 'Proper Waste Management Policy',
      effectiveDate: new Date().toISOString(),
      ministry: 'Environment'
    };
    const result = await service.check(policy, 'SriLanka');
    expect(result.compliant).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  test('returns issues for an invalid Sri Lanka policy', async () => {
    const policy = {
      title: 'Bad',
      // missing effectiveDate and ministry
    };
    const result = await service.check(policy, 'SriLanka');
    expect(result.compliant).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(1);
    // check for a known issue string
    expect(result.issues.join(' ')).toMatch(/Title is too short|Effective date is required|Ministry must be declared/);
  });
});
