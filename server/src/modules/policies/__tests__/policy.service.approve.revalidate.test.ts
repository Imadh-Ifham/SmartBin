import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';
import { complianceService } from '../compliance.service';
import { notificationService } from '../notification.service';

jest.mock('../policy.repository');
jest.mock('../compliance.service');
jest.mock('../notification.service');

describe('PolicyService approve/revalidate targeted tests', () => {
  afterEach(() => jest.resetAllMocks());

  test('approve throws 409 when compliance fails', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011', ministry: 'Env', version: 1, auditTrail: [] };
    (policyRepository.findById as jest.Mock).mockResolvedValue(fakePolicy);
    (complianceService.check as jest.Mock).mockResolvedValue({ compliant: false, issues: ['missing'] });

    await expect(PolicyService.approve(fakePolicy._id, {} as any)).rejects.toMatchObject({ status: 409, details: ['missing'] });
  });

  test('revalidateCompliance notifies stakeholders when status changes', async () => {
    const fakePolicy: any = { _id: '507f1f77bcf86cd799439011', complianceStatus: 'Compliant', stakeholders: [{ email: 'a@local' }], auditTrail: [], version: 1 };
    (policyRepository.findById as jest.Mock).mockResolvedValue(fakePolicy);
    (complianceService.check as jest.Mock).mockResolvedValue({ compliant: false, issues: ['x'] });
    (policyRepository.update as jest.Mock).mockResolvedValue({ ...fakePolicy, complianceStatus: 'NonCompliant' });
    (notificationService.createAndSend as jest.Mock).mockResolvedValue(true);

    const res = await PolicyService.revalidateCompliance(fakePolicy._id, {} as any);
    expect(res).toBeDefined();
    expect((res as any).statusChanged).toBe(true);
    expect(notificationService.createAndSend).toHaveBeenCalled();
  });
});
