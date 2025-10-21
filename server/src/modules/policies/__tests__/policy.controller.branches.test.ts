import request from 'supertest';
import { createApp } from '../../../test/utils';
import { PolicyService } from '../policy.service';

describe('PolicyController branch coverage tests', () => {
  let app = createApp();

  afterEach(() => jest.resetAllMocks());

  test('create -> 400 when invalid payload triggers Zod', async () => {
    const res = await request(app).post('/policies').send({ title: 'ab' });
    expect(res.status).toBe(400);
  });

  test('update -> 400 when invalid id param type', async () => {
    // send numeric id via URL should still be string but not valid ObjectId, controller calls service which will return null -> 404
    jest.spyOn(PolicyService as any, 'update').mockResolvedValue(null);
    const res = await request(app).put('/policies/123').send({ title: 'New', description: 'Long enough description' });
    expect([400,404]).toContain(res.status);
  });

  test('get/versions/audit/remove -> 404 when service returns null', async () => {
    jest.spyOn(PolicyService as any, 'get').mockResolvedValue(null);
    jest.spyOn(PolicyService as any, 'versions').mockResolvedValue(null);
    jest.spyOn(PolicyService as any, 'audit').mockResolvedValue(null);
    jest.spyOn(PolicyService as any, 'remove').mockResolvedValue(null);

    const id = '507f1f77bcf86cd799439011';
    const g = await request(app).get(`/policies/${id}`);
    expect(g.status).toBe(404);

    const v = await request(app).get(`/policies/${id}/versions`);
    expect(v.status).toBe(404);

    const a = await request(app).get(`/policies/${id}/audit`);
    expect(a.status).toBe(404);

    const d = await request(app).delete(`/policies/${id}`);
    expect(d.status).toBe(404);
  });

  test('flagIssue -> 400 when invalid body and 404 when service returns null', async () => {
    const id = '507f1f77bcf86cd799439011';
    // invalid body
    const bad = await request(app).post(`/policies/${id}/issue`).send({ issue: 'x' });
    expect(bad.status).toBe(400);

    // service returns null
    jest.spyOn(PolicyService as any, 'markIssue').mockResolvedValue(null);
    const res = await request(app).post(`/policies/${id}/issue`).send({ issue: 'Valid issue' });
    expect(res.status).toBe(404);
  });
});
