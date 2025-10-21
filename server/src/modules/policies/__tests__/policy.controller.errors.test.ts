import request from 'supertest';
import { createApp } from '../../../test/utils';
import { PolicyService } from '../policy.service';

describe('PolicyController error branches', () => {
  let app: any = createApp();

  afterEach(() => jest.resetAllMocks());

  const endpoints = [
    { method: 'post', path: '/policies', serviceMethod: 'create' },
    { method: 'get', path: '/policies/507f1f77bcf86cd799439011', serviceMethod: 'get' },
    { method: 'put', path: '/policies/507f1f77bcf86cd799439011', serviceMethod: 'update' },
    { method: 'post', path: '/policies/507f1f77bcf86cd799439011/approve', serviceMethod: 'approve' },
    { method: 'post', path: '/policies/507f1f77bcf86cd799439011/issue', serviceMethod: 'markIssue' },
    { method: 'post', path: '/policies/507f1f77bcf86cd799439011/feedbackRequest', serviceMethod: 'requestFeedback' },
    { method: 'delete', path: '/policies/507f1f77bcf86cd799439011', serviceMethod: 'remove' },
    { method: 'post', path: '/policies/507f1f77bcf86cd799439011/revalidateCompliance', serviceMethod: 'revalidateCompliance' },
  ];

  endpoints.forEach((ep) => {
    test(`${ep.method.toUpperCase()} ${ep.path} -> 500 when ${ep.serviceMethod} throws`, async () => {
      jest.spyOn(PolicyService as any, ep.serviceMethod).mockImplementation(() => { throw new Error('boom'); });
      const payloads: any = {
        '/policies': { title: 'Valid Title', description: 'Long enough description', effectiveDate: new Date().toISOString(), ministry: 'Env' },
        '/policies/507f1f77bcf86cd799439011': {},
        '/policies/507f1f77bcf86cd799439011/issue': { issue: 'An issue' },
        '/policies/507f1f77bcf86cd799439011/feedbackRequest': { stakeholderGroups: ['resident'], message: 'please' },
      };
      const body = payloads[ep.path] ?? {};
      const res = await (request(app) as any)[ep.method](ep.path).send(body);
      expect(res.status).toBe(500);
    });
  });
});
