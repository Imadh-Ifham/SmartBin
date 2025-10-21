import { policyRepository } from '../policy.repository';
import { Policy } from '../policy.model';
import { PolicyVersion } from '../policy.version.model';

jest.mock('../policy.model');
jest.mock('../policy.version.model');

describe('PolicyRepository more', () => {
  afterEach(() => jest.resetAllMocks());

  test('create constructs and saves a policy', async () => {
    (Policy as any).mockImplementation(function (this: any, doc: any) { Object.assign(this, doc); this.save = jest.fn().mockResolvedValue(this); });
    const doc = { title: 'T' };
    const res = await policyRepository.create(doc as any);
    expect(res.title).toBe('T');
  });

  test('update calls save on policy', async () => {
    const p: any = { save: jest.fn().mockResolvedValue({ ok: true }) };
    const res = await policyRepository.update(p as any);
    expect(res).toEqual({ ok: true });
  });

  test('deleteById calls findByIdAndDelete', async () => {
    (Policy.findByIdAndDelete as unknown as jest.Mock).mockResolvedValue(true);
    const res = await policyRepository.deleteById('1');
    expect(res).toBe(true);
  });

  test('saveVersion calls PolicyVersion.create', async () => {
    (PolicyVersion.create as unknown as jest.Mock).mockResolvedValue(true);
    const res = await policyRepository.saveVersion('1', 1, { a: 1 }, 'u');
    expect(res).toBe(true);
  });
});
