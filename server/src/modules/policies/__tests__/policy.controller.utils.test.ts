import { feedbackDateSchema, sendError, extractUserId, buildServiceOptions } from '../policy.controller';
import { z } from 'zod';

describe('policy.controller utility functions and schemas', () => {
  describe('feedbackDateSchema', () => {
    it('rejects empty string', () => {
      const parsed = feedbackDateSchema.safeParse('');
      expect(parsed.success).toBe(false);
    });
    it('rejects invalid date string', () => {
      const parsed = feedbackDateSchema.safeParse('not-a-date');
      expect(parsed.success).toBe(false);
    });
    it('accepts valid date string', () => {
      const parsed = feedbackDateSchema.safeParse('2025-10-01');
      expect(parsed.success).toBe(true);
      expect(parsed.data instanceof Date).toBe(true);
    });
    it('accepts Date object', () => {
      const d = new Date('2025-10-01');
      const parsed = feedbackDateSchema.safeParse(d);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toEqual(d);
    });
  });

  describe('sendError', () => {
    it('sends error response with code and message', () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      sendError(res as any, 400, 'Bad', { details: 'x' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad', details: { details: 'x' } });
    });
  });

  describe('extractUserId', () => {
    it('extracts user id from req.user.id', () => {
      const req = { user: { id: 'abc' } };
      expect(extractUserId(req as any)).toBe('abc');
    });
    it('extracts user id from req.user._id', () => {
      const req = { user: { _id: 'def' } };
      expect(extractUserId(req as any)).toBe('def');
    });
    it('returns undefined if no user', () => {
      expect(extractUserId({} as any)).toBeUndefined();
    });
  });

  describe('buildServiceOptions', () => {
    it('returns object with userId if provided', () => {
      expect(buildServiceOptions('abc')).toEqual({ userId: 'abc' });
    });
    it('returns empty object if no userId', () => {
      expect(buildServiceOptions(undefined)).toEqual({});
    });
  });
});
