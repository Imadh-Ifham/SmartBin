import { PolicyService } from '../policy.service';
import { policyRepository } from '../policy.repository';
import { Policy } from '../policy.model';
import { notificationService } from '../notification.service';
import { feedbackService } from '../feedback.service';
import { reportService } from '../report.service';
import { complianceService } from '../compliance.service';

jest.mock('../policy.repository');
jest.mock('../notification.service');
jest.mock('../feedback.service');
jest.mock('../report.service');
jest.mock('../compliance.service');

describe('PolicyService additional tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  test('create persists policy and sends notification', async () => {
    const input = {
      title: 'Title Example',
      description: 'A valid description that is long enough',
      effectiveDate: new Date(),
      ministry: 'Environment'
    } as any;

    const saved = { ...input, _id: '507f1f77bcf86cd799439011', version: 1, auditTrail: [] } as any;
    (policyRepository.create as jest.Mock).mockResolvedValue(saved);
    (notificationService.createAndSend as jest.Mock).mockResolvedValue(true);

    const result = await PolicyService.create(input, {} as any);

    expect(result).toBe(saved);
    expect(policyRepository.create).toHaveBeenCalled();
    expect(notificationService.createAndSend).toHaveBeenCalled();
  });

  test('approve sets status active and notifies stakeholders', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      title: 'P',
      stakeholders: [{ email: 'a@local' }],
      status: 'UnderReview',
      version: 1,
      auditTrail: [],
      save: jest.fn().mockResolvedValue(true)
    };

    (policyRepository.findById as jest.Mock).mockResolvedValue(fakePolicy);
    (policyRepository.update as jest.Mock).mockImplementation(async (p) => ({ ...p, updated: true }));
    (complianceService.check as jest.Mock).mockResolvedValue({ compliant: true, issues: [] });
    (notificationService.createAndSend as jest.Mock).mockResolvedValue(true);

    const updated = await PolicyService.approve(fakePolicy._id, {} as any);

    expect(updated).toBeDefined();
    expect(policyRepository.update).toHaveBeenCalled();
    expect(notificationService.createAndSend).toHaveBeenCalled();
  });

  test('update happy path updates fields and saves', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Old',
      version: 1,
      auditTrail: [],
      save: jest.fn().mockResolvedValue(true)
    };

    (policyRepository.findById as jest.Mock).mockResolvedValue(fakePolicy);
    (policyRepository.update as jest.Mock).mockImplementation(async (p) => p);
    (complianceService.check as jest.Mock).mockResolvedValue({ compliant: true, issues: [] });

    const res = await PolicyService.update(fakePolicy._id, { title: 'New Title' } as any, {} as any);

    expect(res).toBeDefined();
    expect(res.title).toBe('New Title');
    expect(policyRepository.update).toHaveBeenCalled();
  });

  test('markIssue appends issue and saves', async () => {
    const fakePolicy: any = {
      _id: '507f1f77bcf86cd799439011',
      issues: [],
      version: 1,
      auditTrail: [],
      save: jest.fn().mockResolvedValue(true)
    };

  // markIssue uses the Policy model's findById -> spy on it
  jest.spyOn(Policy, 'findById').mockResolvedValue(fakePolicy as any);

    const saved = await PolicyService.markIssue(fakePolicy._id, 'A new issue', {} as any);

    expect(saved).toBeDefined();
    expect(fakePolicy.issues).toContain('A new issue');
  });
});
