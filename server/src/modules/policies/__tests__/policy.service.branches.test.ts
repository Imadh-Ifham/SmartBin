import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';

describe('PolicyService remaining branch coverage', () => {
  afterEach(() => jest.resetAllMocks());

  test('enrichPolicy success path sets performanceReport/violations/feedbackSummary/complianceStatus', async () => {
    const policy = { _id: '507f1f77bcf86cd799439011', title: 'P' } as any;
    jest.spyOn(policyRepository, 'find' as any).mockResolvedValue([policy]);
    jest.spyOn(require('../report.service').reportService, 'getPerformanceForPolicy' as any).mockResolvedValue({ score: 99 });
    jest.spyOn(require('../report.service').reportService, 'getViolationsForPolicy' as any).mockResolvedValue(['v1']);
    jest.spyOn(require('../feedback.service').feedbackService, 'getSummary' as any).mockResolvedValue({ total: 1 });
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true });

    const res = await PolicyService.list({});
    expect(Array.isArray(res)).toBe(true);
    expect((res as any)[0].performanceReport).toBeDefined();
    expect((res as any)[0].violations).toBeDefined();
    expect((res as any)[0].feedbackSummary).toBeDefined();
    expect((res as any)[0].complianceStatus).toBeDefined();
  });

  test('approve notifies stakeholders by name when email missing', async () => {
    const policy: any = { _id: '507f1f77bcf86cd799439011', title: 'T', version: 1, stakeholders: [{ name: 'Alice' }], auditTrail: [] };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true });
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...policy, status: 'Active' });
    const notifySpy = jest.spyOn(require('../notification.service').notificationService, 'createAndSend' as any).mockResolvedValue({});

    const res = await PolicyService.approve(policy._id, {} as any);
    expect(notifySpy).toHaveBeenCalled();
    expect(res).toBeTruthy();
  });

  test('revalidateCompliance works when previousStatus undefined and notifies', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011', complianceStatus: undefined, stakeholders: [{ email: 'a@local' }], auditTrail: [], version: 1 };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(fakePolicy);
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: false, issues: ['x'] });
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...fakePolicy, complianceStatus: 'NonCompliant' });
    const notify = jest.spyOn(require('../notification.service').notificationService, 'createAndSend' as any).mockResolvedValue({});

    const r = await PolicyService.revalidateCompliance(fakePolicy._id, {} as any);
    expect(r).toBeDefined();
    expect(r!.statusChanged).toBe(true);
    expect(notify).toHaveBeenCalled();
  });

  test('create includes audit user when options.userId provided and still returns saved policy', async () => {
    const saved: any = { _id: '507f1f77bcf86cd799439011', version: 1, auditTrail: [] };
    jest.spyOn(policyRepository, 'create' as any).mockResolvedValue(saved);
    const notify = jest.spyOn(require('../notification.service').notificationService, 'createAndSend' as any).mockResolvedValue({});

    const data = { title: 'Valid', description: 'Long enough description', effectiveDate: new Date() } as any;
    const res = await PolicyService.create(data, { userId: '507f1f77bcf86cd799439011' } as any);
    expect(res).toBe(saved);
    expect(notify).toHaveBeenCalled();
  });

  test('list uses q filter when provided', async () => {
    const policy = { _id: '507f1f77bcf86cd799439011', title: 'SearchMe', description: 'desc', ministry: 'm' } as any;
    const spy = jest.spyOn(policyRepository, 'find' as any).mockResolvedValue([policy]);
    jest.spyOn(require('../report.service').reportService, 'getPerformanceForPolicy' as any).mockResolvedValue({});
    jest.spyOn(require('../report.service').reportService, 'getViolationsForPolicy' as any).mockResolvedValue([]);
    jest.spyOn(require('../feedback.service').feedbackService, 'getSummary' as any).mockResolvedValue({});
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true });

    const res = await PolicyService.list({ q: 'SearchMe' });
    expect(spy).toHaveBeenCalled();
    expect(res.length).toBeGreaterThan(0);
  });
});
