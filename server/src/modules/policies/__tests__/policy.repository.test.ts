import { policyRepository } from '../policy.repository';
import { Policy } from '../policy.model';

jest.mock('../policy.model');

describe('PolicyRepository', () => {
  afterEach(() => jest.resetAllMocks());

  test('find calls Policy.find and returns array', async () => {
    (Policy.find as unknown as jest.Mock).mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([{ _id: '1' }]) }) });
    const res = await policyRepository.find({});
    expect(Array.isArray(res)).toBe(true);
  });

  test('findById calls Policy.findById', async () => {
    (Policy.findById as unknown as jest.Mock).mockResolvedValue({ _id: '1' });
    const res = await policyRepository.findById('1');
    expect(res).toBeDefined();
    expect((res as any)._id).toBe('1');
  });
});
