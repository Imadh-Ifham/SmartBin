import request from 'supertest';
import { createApp } from '../../../test/utils';
import { notificationService } from '../notification.service';

describe('PolicyController notification fallback', () => {
  let app: any = createApp();

  afterEach(() => jest.resetAllMocks());

  test('requestFeedback continues when notificationService throws', async () => {
    // make service findById return a policy via repository spy
    const mockPolicy = { _id: '507f1f77bcf86cd799439011', title: 'P', version: 1 };
    jest.spyOn(require('../policy.repository').policyRepository, 'findById' as any).mockResolvedValue(mockPolicy);

    jest.spyOn(notificationService, 'createAndSend' as any).mockImplementation(() => { throw new Error('notify fail'); });

    const res = await request(app).post(`/policies/${mockPolicy._id}/feedbackRequest`).send({ stakeholderGroups: ['resident'], message: 'pls' });
    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();
  });
});
