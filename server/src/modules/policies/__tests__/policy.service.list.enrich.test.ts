import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';
import { reportService } from '../report.service';
import { feedbackService } from '../feedback.service';

describe('PolicyService.list and enrich', () => {
  afterEach(() => jest.resetAllMocks());

  test('list applies q/category/ministry filters and enriches policies', async () => {
    const policyA: any = { _id: '507f1f77bcf86cd799439011', title: 'Alpha', description: 'desc', ministry: 'Env', category: 'Cat', version: 1 };
    const policyB: any = { _id: '507f1f77bcf86cd799439012', title: 'Beta', description: 'desc2', ministry: 'Health', category: 'Cat2', version: 1 };
    jest.spyOn(policyRepository, 'find' as any).mockResolvedValue([policyA, policyB]);
  (jest.spyOn(reportService as any, 'getPerformanceForPolicy') as any).mockImplementation(async (id: string) => ({ policyId: id, performanceScore: 80, monthly: [] }));
  (jest.spyOn(reportService as any, 'getViolationsForPolicy') as any).mockResolvedValue([]);
  (jest.spyOn(feedbackService as any, 'getSummary') as any).mockResolvedValue({ count: 0 });

    const results = await PolicyService.list({ q: 'Alpha', category: 'Cat', ministry: 'Env' });
    expect(Array.isArray(results)).toBe(true);
    expect((results as any[])[0].performanceReport).toBeDefined();
  });

  test('enrichPolicy falls back when reportService throws', async () => {
    const policy: any = { _id: '507f1f77bcf86cd799439011', title: 'Alpha', ministry: 'Env' };
    jest.spyOn(policyRepository, 'find' as any).mockResolvedValue([policy]);
  (jest.spyOn(reportService as any, 'getPerformanceForPolicy') as any).mockImplementation(() => { throw new Error('boom'); });
  (jest.spyOn(reportService as any, 'getViolationsForPolicy') as any).mockImplementation(() => { throw new Error('boom'); });
  (jest.spyOn(feedbackService as any, 'getSummary') as any).mockImplementation(() => { throw new Error('boom'); });
    // complianceService.check is used as well — let it return compliant
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true });

    const results = await PolicyService.list({});
    expect(Array.isArray(results)).toBe(true);
    expect((results as any[])[0].performanceReport).toBeUndefined();
  });
});
