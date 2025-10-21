import { PolicyService } from '../policy.service';
import { reportService } from '../report.service';
import { feedbackService } from '../feedback.service';
import { complianceService } from '../compliance.service';
import { policyRepository } from '../policy.repository';

jest.mock('../report.service');
jest.mock('../feedback.service');
jest.mock('../compliance.service');
jest.mock('../policy.repository');

describe('PolicyService enrichPolicy error branch', () => {
  afterEach(() => jest.resetAllMocks());

  test('enrichPolicy fallback when reportService throws', async () => {
    const p = { _id: '1', title: 'T' } as any;
    (policyRepository.find as jest.Mock).mockResolvedValue([p]);
    (reportService.getPerformanceForPolicy as jest.Mock).mockRejectedValue(new Error('db'));
    (feedbackService.getSummary as jest.Mock).mockResolvedValue({ count: 0 });
    (complianceService.check as jest.Mock).mockResolvedValue({ compliant: true, issues: [] });

    const res = await PolicyService.list({});
    expect(Array.isArray(res)).toBe(true);
    expect((res[0] as any).performanceReport).toBeUndefined();
  });
});
