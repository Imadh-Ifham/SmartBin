import { reportService } from '../report.service';

describe('ReportService', () => {
  test('getPerformanceForPolicy returns a performance report shape', async () => {
    const res = await reportService.getPerformanceForPolicy('abc');
    expect(res.policyId).toBe('abc');
    expect(Array.isArray(res.monthly)).toBe(true);
    expect(res.monthly.length).toBeGreaterThan(0);
  });

  test('getViolationsForPolicy returns violation for odd length id', async () => {
    const withViolation = await reportService.getViolationsForPolicy('abc');
    expect(Array.isArray(withViolation)).toBe(true);
    expect(withViolation.length).toBeGreaterThanOrEqual(1);

    const none = await reportService.getViolationsForPolicy('abcd');
    expect(none.length).toBe(0);
  });
});
