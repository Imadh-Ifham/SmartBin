import request from 'supertest';
import { createApp } from '../../../test/utils';
import { PolicyService } from '../policy.service';

describe('PolicyController integration tests', () => {
  let app: any = createApp();

  afterEach(() => jest.resetAllMocks());

  test('POST /policies returns 400 for invalid payload', async () => {
    const res = await request(app).post('/policies').send({ title: 'x' });
    expect(res.status).toBe(400);
  });

  test('POST /policies create happy path returns 201', async () => {
    const payload = { title: 'Valid Title', description: 'A long enough description', effectiveDate: new Date().toISOString(), ministry: 'Env' };
    const saved = { ...payload, _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(PolicyService as any, 'create').mockResolvedValue(saved);
    const res = await request(app).post('/policies').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.policy).toBeDefined();
  });

  test('GET /policies/:id returns 404 when not found', async () => {
  jest.spyOn(PolicyService as any, 'get').mockResolvedValue(null);
    const res = await request(app).get('/policies/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  test('POST /policies/:id/approve happy path returns 200', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011', title: 'T' };
  jest.spyOn(PolicyService as any, 'approve').mockResolvedValue(fake);
    const res = await request(app).post(`/policies/${fake._id}/approve`);
    expect(res.status).toBe(200);
    expect(res.body.policy).toBeDefined();
  });

  test('PUT /policies/:id returns 400 for invalid update payload', async () => {
    const res = await request(app).put('/policies/507f1f77bcf86cd799439011').send({ title: 'x' });
    expect(res.status).toBe(400);
  });

  test('PUT /policies/:id happy path returns 200', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011', title: 'Old' };
    jest.spyOn(PolicyService as any, 'update').mockResolvedValue({ ...fake, title: 'New' });
    const res = await request(app).put(`/policies/${fake._id}`).send({ title: 'New', description: 'Long enough description' });
    expect(res.status).toBe(200);
    expect(res.body.policy).toBeDefined();
  });

  test('POST /policies/:id/feedbackRequest returns 200', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(PolicyService as any, 'requestFeedback').mockResolvedValue({ policyId: fake._id });
    const res = await request(app).post(`/policies/${fake._id}/feedbackRequest`).send({ stakeholderGroups: ['resident'], message: 'please review' });
    expect(res.status).toBe(200);
  });

  test('POST /policies/:id/revalidateCompliance returns 200', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(PolicyService as any, 'revalidateCompliance').mockResolvedValue({ policy: fake, complianceResult: { compliant: true, issues: [] }, statusChanged: false });
    const res = await request(app).post(`/policies/${fake._id}/revalidateCompliance`);
    expect(res.status).toBe(200);
    expect(res.body.complianceResult).toBeDefined();
  });

  test('GET /policies/:id success returns 200', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011', title: 'T' };
    jest.spyOn(PolicyService as any, 'get').mockResolvedValue(fake);
    const res = await request(app).get(`/policies/${fake._id}`);
    expect(res.status).toBe(200);
    expect(res.body.policy).toBeDefined();
  });

  test('GET /policies/:id/versions returns versions', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(PolicyService as any, 'versions').mockResolvedValue([{ version: 1 }]);
    const res = await request(app).get(`/policies/${fake._id}/versions`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('GET /policies/:id/audit returns audit trail', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(PolicyService as any, 'audit').mockResolvedValue([{ action: 'x', date: new Date() }]);
    const res = await request(app).get(`/policies/${fake._id}/audit`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('GET /policies?q= searches and returns list', async () => {
    jest.spyOn(PolicyService as any, 'list').mockResolvedValue([{ _id: '1', title: 'T' }]);
    const res = await request(app).get('/policies').query({ q: 'T' });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('POST /policies/:id/issue records issue and returns 200', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(PolicyService as any, 'markIssue').mockResolvedValue({ ...fake, issues: ['x'] });
    const res = await request(app).post(`/policies/${fake._id}/issue`).send({ issue: 'An issue' });
    expect(res.status).toBe(200);
    expect(res.body.policy).toBeDefined();
  });

  test('DELETE /policies/:id returns 200 on success', async () => {
    const fake = { _id: '507f1f77bcf86cd799439011' };
    jest.spyOn(PolicyService as any, 'remove').mockResolvedValue(true);
    const res = await request(app).delete(`/policies/${fake._id}`);
    expect(res.status).toBe(200);
  });
});
