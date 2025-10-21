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
});
