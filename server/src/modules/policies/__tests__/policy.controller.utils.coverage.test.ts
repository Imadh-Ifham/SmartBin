import { sendError, asyncHandler } from '../policy.controller';
import { Request, Response, NextFunction } from 'express';

describe('PolicyController utilities', () => {
  test('sendError returns correct response', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    sendError(res, 400, 'Bad', { details: 'info' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad', details: { details: 'info' } });
  });

  test('asyncHandler forwards errors to next', async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn();
    const errorFn = async () => { throw new Error('fail'); };
    await asyncHandler(errorFn)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
