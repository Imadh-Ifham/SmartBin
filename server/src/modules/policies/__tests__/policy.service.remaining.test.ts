import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';

describe('PolicyService remaining small branches', () => {
  afterEach(() => jest.resetAllMocks());

  test('approve skips compliance check & notification when no ministry and no stakeholders', async () => {
    const policy: any = { _id: '507f1f77bcf86cd799439011', version: 1, auditTrail: [], stakeholders: [] };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    const checkSpy = jest.spyOn(require('../compliance.service').complianceService as any, 'check').mockResolvedValue({ compliant: true });
    const saveSpy = jest.spyOn(policyRepository, 'saveVersion' as any).mockResolvedValue(undefined);
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...policy, status: 'Active' });
    const notifySpy = jest.spyOn(require('../notification.service').notificationService as any, 'createAndSend').mockResolvedValue({});

    const res = await PolicyService.approve(policy._id, {} as any);
    expect(res).toBeTruthy();
    // since no ministry and enforceCompliance not set, complianceService.check should not be called
    expect(checkSpy).not.toHaveBeenCalled();
    // no stakeholders => notification should not be called
    expect(notifySpy).not.toHaveBeenCalled();
  });

  test('update does not call saveVersion when mongoose not connected', async () => {
    const mongoose = require('mongoose');
    const originalState = mongoose.connection.readyState;
    (mongoose.connection as any).readyState = 0; // not connected

    const policy: any = { _id: '507f1f77bcf86cd799439011', version: 1, auditTrail: [], feedback: [], issues: [] };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    const saveSpy = jest.spyOn(policyRepository, 'saveVersion' as any).mockResolvedValue(undefined);
    jest.spyOn(policyRepository, 'update' as any).mockImplementation(async (p) => p);

    const res = await PolicyService.update(policy._id, { title: 'New' } as any, {} as any);
    expect(res).toBeDefined();
    expect(saveSpy).not.toHaveBeenCalled();

    (mongoose.connection as any).readyState = originalState;
  });

  test('list builds query when category/ministry/status/complianceStatus provided', async () => {
    const policy: any = { _id: '507f1f77bcf86cd799439011', title: 'T', description: 'D', ministry: 'M' };
    const findSpy = jest.spyOn(policyRepository, 'find' as any).mockResolvedValue([policy]);
    jest.spyOn(require('../report.service').reportService, 'getPerformanceForPolicy' as any).mockResolvedValue({});
    jest.spyOn(require('../report.service').reportService, 'getViolationsForPolicy' as any).mockResolvedValue([]);
    jest.spyOn(require('../feedback.service').feedbackService, 'getSummary' as any).mockResolvedValue({});
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true });

    const res = await PolicyService.list({ category: 'cat', ministry: 'M', status: 'Active', complianceStatus: 'Compliant' } as any);
    expect(findSpy).toHaveBeenCalled();
  const calledQuery = (findSpy.mock.calls[0]?.[0]) as any;
  expect(calledQuery?.category).toBe('cat');
  expect(calledQuery?.ministry).toBe('M');
  expect(calledQuery?.status).toBe('Active');
  expect(calledQuery?.complianceStatus).toBe('Compliant');
    expect(Array.isArray(res)).toBe(true);
  });
});
