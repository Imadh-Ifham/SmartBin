import mongoose from 'mongoose';
import { NotificationModel } from '../notification.model';
import { notificationService } from '../notification.service';

describe('NotificationService', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    await notificationService.clear();
  });

  test('falls back to in-memory store when DB create fails or no connection', async () => {
    // Simulate mongoose not connected
    const origConn = (mongoose as any).connection;
    (mongoose as any).connection = undefined;

    const result = await notificationService.createAndSend('Test', ['a@local'], { foo: 'bar' });
    expect(result).toMatchObject({ type: 'Test', recipients: ['a@local'] });
    const all = await notificationService.getAll();
    expect(all.find((n: any) => n.type === 'Test')).toBeTruthy();

    // restore
    (mongoose as any).connection = origConn;
  });

  test('uses NotificationModel.create when connected and create succeeds', async () => {
    // Mock a connected state and NotificationModel.create
    const fakeConnection: any = { readyState: 1, on: () => {}, once: () => {} };
    jest.spyOn(mongoose, 'connection', 'get').mockReturnValue(fakeConnection as any);
    const createSpy = jest.spyOn(NotificationModel, 'create' as any).mockResolvedValue({});

    const result = await notificationService.createAndSend('DBTest', ['b@local'], { hello: 'world' });
    expect(createSpy).toHaveBeenCalled();
    expect(result).toMatchObject({ type: 'DBTest', recipients: ['b@local'] });
    createSpy.mockRestore();
    (jest.spyOn(mongoose, 'connection', 'get') as any).mockRestore();
  });
});
