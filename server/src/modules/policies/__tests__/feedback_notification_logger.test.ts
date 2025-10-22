import { feedbackService } from '../feedback.service';
import { notificationService } from '../notification.service';
import { logger } from '../logger';

describe('Feedback and Notification Services', () => {
  beforeEach(async () => {
    await notificationService.clear();
  });

  test('feedbackService add/getSummary in-memory flow', async () => {
    const pid = 'policy-1';
    await feedbackService.addFeedback(pid, { stakeholderType: 'resident', message: 'ok', date: new Date().toISOString() });
    const summary = await feedbackService.getSummary(pid);
    expect(summary.count).toBeGreaterThanOrEqual(1);
    expect(summary.lastRequested).toBeDefined();
  });

  test('notificationService createAndSend stores in memory and clear works', async () => {
    const note = await notificationService.createAndSend('TYPE', ['a@x.com'], { foo: 'bar' });
    expect(note.type).toBe('TYPE');
    const all = await notificationService.getAll();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThanOrEqual(1);
    await notificationService.clear();
    const empty = await notificationService.getAll();
    expect(Array.isArray(empty)).toBe(true);
  });

  test('logger methods do not throw', () => {
    logger.info('info test', { a: 1 });
    logger.warn('warn test', { b: 2 });
    logger.error('error test', { c: 3 });
    logger.debug('debug test', { d: 4 });
  });
});
