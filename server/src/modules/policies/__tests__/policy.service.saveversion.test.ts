import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';
import mongoose from 'mongoose';

jest.mock('../policy.repository');

describe('PolicyService saveVersion branch', () => {
  afterEach(() => jest.resetAllMocks());

  test('update saves version when mongoose.connected', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      version: 1,
      title: 'T',
      feedback: [],
      auditTrail: [],
    };

    (policyRepository.findById as jest.Mock).mockResolvedValue(fakePolicy);
    (policyRepository.saveVersion as jest.Mock).mockResolvedValue(true);
    (policyRepository.update as jest.Mock).mockResolvedValue({ ...fakePolicy, title: 'New' });

    // Simulate mongoose connection ready
    const originalState = mongoose.connection.readyState;
    (mongoose.connection as any).readyState = 1;

    const res = await PolicyService.update(fakePolicy._id, { title: 'New' } as any, {} as any);

    // restore
    (mongoose.connection as any).readyState = originalState;

    expect(res).toBeDefined();
    expect(policyRepository.saveVersion).toHaveBeenCalled();
  });
});
