import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';
import { PolicyVersion } from '../policy.version.model';
import { Policy } from '../policy.model';
import { notificationService } from '../notification.service';
import { complianceService } from '../compliance.service';

describe('PolicyService additional coverage', () => {
  afterEach(() => jest.resetAllMocks());

  test('versions returns null for invalid id and returns list when valid', async () => {
    const resInvalid = await PolicyService.versions('not-valid');
    expect(resInvalid).toBeNull();

    // mock find chain
    const fakeVersions = [{ _id: 'v1' }, { _id: 'v2' }];
    jest.spyOn(PolicyVersion, 'find' as any).mockReturnValue({ sort: () => ({ lean: () => Promise.resolve(fakeVersions) }) } as any);

    const res = await PolicyService.versions('507f1f77bcf86cd799439011');
    expect(res).toEqual(fakeVersions);
  });

  test('audit returns null for invalid id and audit trail when present', async () => {
    const r1 = await PolicyService.audit('bad');
    expect(r1).toBeNull();

    const mockPolicy: any = { _id: '507f1f77bcf86cd799439011', auditTrail: [{ action: 'a' }] };
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(mockPolicy);

    const r2 = await PolicyService.audit('507f1f77bcf86cd799439011');
    expect(r2).toEqual(mockPolicy.auditTrail);
  });

  test('get and update return null on invalid id or missing policy', async () => {
    const g1 = await PolicyService.get('bad');
    expect(g1).toBeNull();

    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(null);
    const g2 = await PolicyService.get('507f1f77bcf86cd799439011');
    expect(g2).toBeNull();

    const u1 = await PolicyService.update('bad', {} as any, {} as any);
    expect(u1).toBeNull();

    const u2 = await PolicyService.update('507f1f77bcf86cd799439011', {} as any, {} as any);
    expect(u2).toBeNull();
  });

  test('markIssue finds policy and saves with new issue', async () => {
    const saveMock = jest.fn().mockResolvedValue(true);
    const mockPolicy: any = { _id: '507f1f77bcf86cd799439011', issues: [], auditTrail: [], save: saveMock };
    jest.spyOn(Policy, 'findById' as any).mockResolvedValue(mockPolicy);

    const res = await PolicyService.markIssue(mockPolicy._id, 'New issue', { userId: '507f1f77bcf86cd799439011' });
    expect(saveMock).toHaveBeenCalled();
  });

  test('approve sends notification to stakeholders when present', async () => {
    const policy = { _id: '507f1f77bcf86cd799439011', title: 'T', version: 1, stakeholders: [{ email: 'a@local' }], auditTrail: [] } as any;
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    jest.spyOn(complianceService, 'check' as any).mockResolvedValue({ compliant: true });
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...policy, status: 'Active' });
    const notifySpy = jest.spyOn(notificationService, 'createAndSend' as any).mockResolvedValue({});

    const res = await PolicyService.approve(policy._id, { userId: '507f1f77bcf86cd799439011' });
    expect(notifySpy).toHaveBeenCalled();
    expect(res).toBeTruthy();
  });

  test('revalidateCompliance notifies when status changes and handles notification failures', async () => {
    const policy = { _id: '507f1f77bcf86cd799439011', title: 'T', complianceStatus: 'Compliant', stakeholders: [{ email: 'a@local' }], auditTrail: [] } as any;
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    jest.spyOn(complianceService, 'check' as any).mockResolvedValue({ compliant: false, issues: ['i'] });
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...policy, complianceStatus: 'NonCompliant' });
    jest.spyOn(notificationService, 'createAndSend' as any).mockImplementation(() => { throw new Error('boom'); });

  const res = await PolicyService.revalidateCompliance(policy._id, { userId: '507f1f77bcf86cd799439011' });
  expect(res).not.toBeNull();
  // Type guard for TS
  if (!res) throw new Error('expected result');
  expect(res.policy).toBeTruthy();
  expect(res.statusChanged).toBe(true);
  });

  test('update saves version warning branch when saveVersion throws', async () => {
    const mongoose = require('mongoose');
    const fakeConn: any = { readyState: 1 };
    jest.spyOn(mongoose, 'connection', 'get').mockReturnValue(fakeConn as any);

    const policy = { _id: '507f1f77bcf86cd799439011', version: 2, auditTrail: [], issues: [], feedback: [], ministry: 'Env' } as any;
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    jest.spyOn(policyRepository, 'saveVersion' as any).mockRejectedValue(new Error('save fail'));
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true });
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...policy, title: 'New' });

    const res = await PolicyService.update(policy._id, { title: 'New' } as any, { userId: '507f1f77bcf86cd799439011' });
    expect(res).toBeTruthy();
    (jest.spyOn(mongoose, 'connection', 'get') as any).mockRestore();
  });

  test('approve handles notification throw and still returns updated policy', async () => {
    const policy = { _id: '507f1f77bcf86cd799439011', title: 'T', version: 1, stakeholders: [{ email: 'a@local' }], auditTrail: [] } as any;
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true });
    jest.spyOn(policyRepository, 'saveVersion' as any).mockResolvedValue(undefined);
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...policy, status: 'Active' });
    const notifySpy = jest.spyOn(require('../notification.service').notificationService, 'createAndSend' as any).mockImplementation(() => { throw new Error('boom'); });

    const res = await PolicyService.approve(policy._id, { userId: '507f1f77bcf86cd799439011' });
    expect(res).toBeTruthy();
    expect(notifySpy).toHaveBeenCalled();
  });

  test('revalidateCompliance when status does not change does not notify', async () => {
    const policy = { _id: '507f1f77bcf86cd799439011', title: 'T', complianceStatus: 'Compliant', stakeholders: [], auditTrail: [] } as any;
    jest.spyOn(policyRepository, 'findById' as any).mockResolvedValue(policy);
    jest.spyOn(require('../compliance.service').complianceService, 'check' as any).mockResolvedValue({ compliant: true, issues: [] });
    jest.spyOn(policyRepository, 'update' as any).mockResolvedValue({ ...policy });
    const notifySpy = jest.spyOn(require('../notification.service').notificationService, 'createAndSend' as any).mockResolvedValue({});

    const res = await PolicyService.revalidateCompliance(policy._id, { userId: '507f1f77bcf86cd799439011' });
    expect(res).not.toBeNull();
    if (!res) throw new Error('expected');
    expect(res.statusChanged).toBe(false);
    expect(notifySpy).not.toHaveBeenCalled();
  });
});
