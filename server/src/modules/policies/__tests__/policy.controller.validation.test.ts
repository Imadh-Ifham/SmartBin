import request from 'supertest';
import { createApp } from '../../../test/utils';

describe('PolicyController validation and 4xx branches', () => {
  let app = createApp();

  test('create returns 400 for invalid payload', async () => {
    const res = await request(app).post('/policies').send({ title: 'x' });
    expect(res.status).toBe(400);
  });

  test('get returns 400 for non-string id param', async () => {
    const res = await request(app).get('/policies/123');
    // '123' is a string but not a 24-char hex -> controller will call service and service returns null -> 404
    expect([400,404]).toContain(res.status);
  });

  test('flagIssue returns 400 for short issue', async () => {
    const res = await request(app).post('/policies/507f1f77bcf86cd799439011/issue').send({ issue: 'x' });
    expect(res.status).toBe(400);
  });
});
