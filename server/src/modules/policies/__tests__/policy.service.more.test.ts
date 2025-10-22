import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';
import { reportService } from '../report.service';
import { feedbackService } from '../feedback.service';
import { complianceService } from '../compliance.service';
import { notificationService } from '../notification.service';
import { PolicyVersion } from '../policy.version.model';
import { Policy } from '../policy.model';

jest.mock('../policy.repository');
jest.mock('../report.service');
jest.mock('../feedback.service');
jest.mock('../compliance.service');
jest.mock('../notification.service');

describe('PolicyService additional read/list tests', () => {
  const validId = '507f1f77bcf86cd799439011';

  afterEach(() => jest.resetAllMocks());

  test('list returns enriched policies', async () => {
    const raw = { _id: validId, title: 'T', description: 'desc', ministry: 'Env', feedback: [], auditTrail: [], version: 1 };
    (policyRepository.find as jest.Mock).mockResolvedValue([raw]);
    (reportService.getPerformanceForPolicy as jest.Mock).mockResolvedValue({ score: 42 });
    (reportService.getViolationsForPolicy as jest.Mock).mockResolvedValue([]);
    (feedbackService.getSummary as jest.Mock).mockResolvedValue({ count: 0 });
    (complianceService.check as jest.Mock).mockResolvedValue({ compliant: true, issues: [] });

  const res = await PolicyService.list({ q: 'T' });
  expect(Array.isArray(res)).toBe(true);
  expect(res.length).toBeGreaterThan(0);
  expect((res[0] as any).performanceReport).toBeDefined();
  expect((res[0] as any).complianceStatus).toBeDefined();
  });

  test('get returns policy when id valid', async () => {
    const p = { _id: validId, title: 'T' } as any;
    (policyRepository.findById as jest.Mock).mockResolvedValue(p);

    const res = await PolicyService.get(validId);
    expect(res).toBe(p);
  });

  test('versions returns stored versions', async () => {
    jest.spyOn(PolicyVersion, 'find').mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([{ version: 1 }]) }) } as any);

    const res = await PolicyService.versions(validId);
    expect(res).toEqual([{ version: 1 }]);
  });

  test('audit returns audit trail array', async () => {
    const p: any = { _id: validId, auditTrail: [{ action: 'x', date: new Date() }] };
    (policyRepository.findById as jest.Mock).mockResolvedValue(p);

    const res = await PolicyService.audit(validId);
    expect(res).toEqual(p.auditTrail);
  });

  test('requestFeedback records feedback and notifies', async () => {
    const p: any = { _id: validId };
    (policyRepository.findById as jest.Mock).mockResolvedValue(p);
    (feedbackService.addFeedback as jest.Mock).mockResolvedValue(true);
    (notificationService.createAndSend as jest.Mock).mockResolvedValue(true);

  const out = await PolicyService.requestFeedback(validId, { stakeholderGroups: ['resident'], message: 'please' }, {} as any);
  expect(out).toBeDefined();
  expect((out as any).policyId).toBe(validId);
  });

  test('remove deletes by id', async () => {
    (policyRepository.deleteById as jest.Mock).mockResolvedValue(true);
    const res = await PolicyService.remove(validId);
    expect(res).toBe(true);
  });
});
