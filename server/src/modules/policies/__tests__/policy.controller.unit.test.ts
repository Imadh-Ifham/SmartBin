import { PolicyController } from '../policy.controller';
import { PolicyService } from '../policy.service';

describe('PolicyController unit tests (direct invocation)', () => {
  afterEach(() => jest.resetAllMocks());

  function mockRes() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return { status, json } as any;
  }

  test('get -> 400 when id param is not a string', async () => {
    const req: any = { params: { id: 123 } };
    const res = mockRes();
    await (PolicyController as any).get(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('approve passes userId from req.user to PolicyService.approve', async () => {
    const req: any = { params: { id: '507f1f77bcf86cd799439011' }, user: { id: 'u1' } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() } as any;

    const spy = jest.spyOn(PolicyService as any, 'approve').mockResolvedValue({ _id: req.params.id });
    await (PolicyController as any).approve(req, res);

    expect(spy).toHaveBeenCalledWith(req.params.id, { userId: 'u1' });
    expect(res.json).toHaveBeenCalled();
  });

  test('requestFeedback -> 404 when service returns null', async () => {
    const req: any = { params: { id: '507f1f77bcf86cd799439011' }, body: { stakeholderGroups: ['resident'], message: 'x' } };
    const res = mockRes();
    jest.spyOn(PolicyService as any, 'requestFeedback').mockResolvedValue(null);
    await (PolicyController as any).requestFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('remove -> 400 when id is not a string', async () => {
    const req: any = { params: { id: 999 } };
    const res = mockRes();
    await (PolicyController as any).remove(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('versions/audit/approve/requestFeedback/revalidateCompliance -> 400 when id not string', async () => {
    const badReq = { params: { id: 123 }, body: {} } as any;
    const res1 = mockRes();
    await (PolicyController as any).versions(badReq, res1);
    expect(res1.status).toHaveBeenCalledWith(400);

    const res2 = mockRes();
    await (PolicyController as any).audit(badReq, res2);
    expect(res2.status).toHaveBeenCalledWith(400);

    const res3 = mockRes();
    await (PolicyController as any).approve(badReq, res3);
    expect(res3.status).toHaveBeenCalledWith(400);

    const res4 = mockRes();
    await (PolicyController as any).requestFeedback(badReq, res4);
    expect(res4.status).toHaveBeenCalledWith(400);

    const res5 = mockRes();
    await (PolicyController as any).revalidateCompliance(badReq, res5);
    expect(res5.status).toHaveBeenCalledWith(400);
  });

  test('list -> 500 when PolicyService.list throws', async () => {
    const req: any = { query: {} };
    const res = mockRes();
    jest.spyOn(PolicyService as any, 'list').mockImplementation(() => { throw new Error('boom'); });
    await (PolicyController as any).list(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('controller handlers return 500 when service throws (generic error path)', async () => {
    const handlers: Array<{ name: string; fn: any; req: any }> = [
  { name: 'create', fn: (PolicyController as any).create, req: { body: { title: 'Valid Title', description: 'A long enough description', effectiveDate: new Date().toISOString() } } },
      { name: 'get', fn: (PolicyController as any).get, req: { params: { id: '507f1f77bcf86cd799439011' } } },
      { name: 'update', fn: (PolicyController as any).update, req: { params: { id: '507f1f77bcf86cd799439011' }, body: { title: 'New', description: 'Long enough desc', effectiveDate: new Date().toISOString() } } },
      { name: 'approve', fn: (PolicyController as any).approve, req: { params: { id: '507f1f77bcf86cd799439011' } } },
      { name: 'flagIssue', fn: (PolicyController as any).flagIssue, req: { params: { id: '507f1f77bcf86cd799439011' }, body: { issue: 'Issue text' } } },
      { name: 'requestFeedback', fn: (PolicyController as any).requestFeedback, req: { params: { id: '507f1f77bcf86cd799439011' }, body: { stakeholderGroups: ['resident'], message: 'x' } } },
      { name: 'remove', fn: (PolicyController as any).remove, req: { params: { id: '507f1f77bcf86cd799439011' } } },
      { name: 'revalidateCompliance', fn: (PolicyController as any).revalidateCompliance, req: { params: { id: '507f1f77bcf86cd799439011' } } },
    ];

    const methodMap: Record<string, string> = {
      create: 'create',
      get: 'get',
      update: 'update',
      approve: 'approve',
      flagIssue: 'markIssue',
      requestFeedback: 'requestFeedback',
      remove: 'remove',
      revalidateCompliance: 'revalidateCompliance',
    };

    for (const h of handlers) {
      jest.resetAllMocks();
      const svcMethod = methodMap[h.name];
      if (svcMethod) {
        jest.spyOn(PolicyService as any, svcMethod as any).mockImplementation(() => { throw new Error('boom'); });
      }
      const res = mockRes();
      await h.fn(h.req, res as any);
      expect(res.status).toHaveBeenCalledWith(500);
    }
  });
});
