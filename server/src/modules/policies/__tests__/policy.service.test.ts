import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';
import { complianceService } from '../compliance.service';

jest.mock('../policy.repository');
jest.mock('../compliance.service');

describe('PolicyService', () => {
  afterEach(() => jest.resetAllMocks());

  test('revalidateCompliance updates compliance status and returns statusChanged=true', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      title: 'P',
      complianceStatus: 'Pending',
      auditTrail: [],
      version: 1,
      save: jest.fn().mockResolvedValue(true)
    };

    // mock repository.findById
    (policyRepository.findById as jest.Mock).mockResolvedValue(fakePolicy);
    (policyRepository.update as jest.Mock).mockImplementation(async (p) => p);

    // make complianceService return compliant
    (complianceService.check as jest.Mock).mockResolvedValue({ compliant: true, issues: [] });

    const result = await PolicyService.revalidateCompliance(fakePolicy._id, {} as any);

  expect(result).toBeDefined();
  expect(result).not.toBeNull();
  expect(result!.statusChanged).toBe(true);
  expect(result!.complianceResult.compliant).toBe(true);
    expect(policyRepository.update).toHaveBeenCalled();
  });

  test('update throws when compliance check fails and enforceCompliance true', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Old Title',
      complianceStatus: 'Compliant',
      auditTrail: [],
      version: 1,
      save: jest.fn().mockResolvedValue(true)
    };

    (policyRepository.findById as jest.Mock).mockResolvedValue(fakePolicy);

    // make complianceService return non-compliant
    (complianceService.check as jest.Mock).mockResolvedValue({ compliant: false, issues: ['problem'] });

    await expect(PolicyService.update(fakePolicy._id, { title: 'New' } as any, { enforceCompliance: true } as any)).rejects.toMatchObject({ message: expect.any(String) });
  });
});
