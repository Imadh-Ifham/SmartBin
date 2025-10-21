import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';
import { notificationService } from '../notification.service';
import { complianceService } from '../compliance.service';

describe('PolicyService fallback and error branches', () => {
  afterEach(() => jest.resetAllMocks());

  test('create handles notification failure gracefully', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011', version: 1, auditTrail: [], save: jest.fn() };
    jest.spyOn(policyRepository, 'create').mockResolvedValue(fakePolicy);
    jest.spyOn(notificationService, 'createAndSend').mockImplementation(() => { throw new Error('fail'); });
    const data = { title: 'T', description: 'desc', effectiveDate: new Date(), ministry: 'Env' };
    const res = await PolicyService.create(data as any, {});
    expect(res).toBe(fakePolicy);
  });

  test('approve handles notification failure gracefully', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011', version: 1, auditTrail: [], stakeholders: [{ email: 'a@local' }] };
    jest.spyOn(policyRepository, 'findById').mockResolvedValue(fakePolicy);
    jest.spyOn(policyRepository, 'update').mockResolvedValue(fakePolicy);
      jest.spyOn(complianceService, 'check').mockResolvedValue({ compliant: true, issues: [] });
    jest.spyOn(notificationService, 'createAndSend').mockImplementation(() => { throw new Error('fail'); });
    const res = await PolicyService.approve(fakePolicy._id, {});
    expect(res).toBe(fakePolicy);
  });

  test('requestFeedback handles notification failure gracefully', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(policyRepository, 'findById').mockResolvedValue(fakePolicy);
    jest.spyOn(notificationService, 'createAndSend').mockImplementation(() => { throw new Error('fail'); });
    const res = await PolicyService.requestFeedback(fakePolicy._id, { stakeholderGroups: ['resident'], message: 'msg' }, {});
    expect(res).toBeDefined();
  });

  test('requestFeedback handles feedbackService.addFeedback failure gracefully', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(policyRepository, 'findById').mockResolvedValue(fakePolicy);
  // make addFeedback throw
  const fbSvc = require('../feedback.service').feedbackService;
  jest.spyOn(fbSvc as any, 'addFeedback').mockImplementation(() => { throw new Error('fb-fail'); });

  // notification should still be attempted and succeed (return shaped payload)
  jest.spyOn(notificationService, 'createAndSend').mockResolvedValue({ type: 'FEEDBACK_REQUEST', recipients: ['resident@local'], payload: {} });

    const res = await PolicyService.requestFeedback(fakePolicy._id, { stakeholderGroups: ['resident'], message: 'msg' }, {});
    expect(res).toBeDefined();
  });

  test('list/enrich falls back when reportService throws', async () => {
    const policy = { _id: '507f1f77bcf86cd799439011', title: 'T' } as any;
    jest.spyOn(policyRepository, 'find' as any).mockResolvedValue([policy]);
    // make one of the reportService calls throw to trigger enrichPolicy catch
    const reportSvc = require('../report.service').reportService;
    jest.spyOn(reportSvc, 'getPerformanceForPolicy' as any).mockImplementation(() => { throw new Error('report fail'); });
    // other services can be no-ops
    jest.spyOn(require('../feedback.service').feedbackService, 'getSummary' as any).mockResolvedValue({});
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true });

    const res = await PolicyService.list({});
  expect(Array.isArray(res)).toBe(true);
  expect((res as any)[0].title).toBe(policy.title);
  });

  test('revalidateCompliance handles notification failure gracefully', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011', complianceStatus: 'Compliant', stakeholders: [{ email: 'a@local' }], auditTrail: [] };
    jest.spyOn(policyRepository, 'findById').mockResolvedValue(fakePolicy);
    jest.spyOn(policyRepository, 'update').mockResolvedValue(fakePolicy);
    jest.spyOn(complianceService, 'check').mockResolvedValue({ compliant: false, issues: ['i'] });
    jest.spyOn(notificationService, 'createAndSend').mockImplementation(() => { throw new Error('fail'); });
    const res = await PolicyService.revalidateCompliance(fakePolicy._id, {});
    expect(res).toBeDefined();
  });

  test('create uses default values for missing fields', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011', version: 1, auditTrail: [], save: jest.fn() };
    jest.spyOn(policyRepository, 'create').mockResolvedValue(fakePolicy);
      jest.spyOn(notificationService, 'createAndSend').mockResolvedValue({ type: 'POLICY_APPROVED', recipients: ['stakeholders@local'], payload: { policyId: fakePolicy._id, version: fakePolicy.version } });
    const data = { title: 'T', description: 'desc', effectiveDate: new Date() };
    const res = await PolicyService.create(data as any, {});
    expect(res).toBe(fakePolicy);
  });

  test('update throws 409 when compliance fails due to policy.ministry', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      ministry: 'Env',
      version: 1,
      auditTrail: [],
      feedback: [],
      issues: []
    };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(fakePolicy);
    jest.spyOn(require('../compliance.service').complianceService as any, 'check').mockResolvedValue({ compliant: false, issues: ['missing'] });

    await expect(PolicyService.update(fakePolicy._id, { title: 'New' } as any, {} as any)).rejects.toMatchObject({ status: 409, details: ['missing'] });
  });

  test('approve catches saveVersion failure and still returns updated policy', async () => {
    const mongoose = require('mongoose');
    // simulate connection ready
    const originalState = mongoose.connection.readyState;
    (mongoose.connection as any).readyState = 1;

    const policy: any = { _id: '507f1f77bcf86cd799439011', title: 'T', version: 1, stakeholders: [{ email: 'a@local' }], auditTrail: [] };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    jest.spyOn(require('../compliance.service').complianceService as any, 'check').mockResolvedValue({ compliant: true });
    jest.spyOn(policyRepository, 'saveVersion' as any).mockRejectedValue(new Error('save fail'));
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...policy, status: 'Active' });
    const notifySpy = jest.spyOn(require('../notification.service').notificationService as any, 'createAndSend').mockResolvedValue({});

    const res = await PolicyService.approve(policy._id, { userId: '507f1f77bcf86cd799439011' } as any);
    expect(res).toBeTruthy();
    expect(policyRepository.saveVersion).toHaveBeenCalled();

    // restore
    (mongoose.connection as any).readyState = originalState;
  });

  test('update appends feedback when update.feedback provided', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      version: 1,
      auditTrail: [],
      feedback: [],
      issues: []
    };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(fakePolicy);
    jest.spyOn(policyRepository, 'update' as any).mockImplementation(async (p) => p);

    const update = { feedback: [{ stakeholderType: 'Resident', message: 'ok' }] } as any;
    const res = await PolicyService.update(fakePolicy._id, update, {} as any);
    expect(res).toBeDefined();
    expect(policyRepository.update).toHaveBeenCalled();
    // ensure feedback was appended
    expect((res as any).feedback.length).toBeGreaterThan(0);
  });

  test('update replaces issues when update.issues provided', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      version: 1,
      auditTrail: [],
      feedback: [],
      issues: ['old']
    };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(fakePolicy);
    jest.spyOn(policyRepository, 'update' as any).mockImplementation(async (p) => p);

    const update = { issues: ['new1', 'new2'] } as any;
    const res = await PolicyService.update(fakePolicy._id, update, {} as any);
    expect(res).toBeDefined();
    expect((res as any).issues).toEqual(['new1', 'new2']);
  });
});
