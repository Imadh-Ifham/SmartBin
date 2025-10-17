import mongoose from 'mongoose';
import { NotificationModel } from './notification.model';

export interface NotificationPayload {
  [key: string]: any;
}

export class NotificationService {
  // in-memory store for demo
  private store: Array<{ type: string; recipients: string[]; payload: NotificationPayload }> = [];

  async createAndSend(
    type: string,
    recipients: string[],
    payload: NotificationPayload
  ): Promise<{ type: string; recipients: string[]; payload: NotificationPayload }> {
    const notification = { type, recipients, payload };

    // Try to persist to DB if connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await NotificationModel.create({
          type,
          recipients,
          payload,
          status: 'sent',
        });
        return notification;
      } catch (err) {
        // fallback to in-memory
      }
    }

    // Store in memory
    this.store.push(notification);

    // Mock send - in production, this would send emails, SMS, push notifications, etc.
    console.log(`📧 Notification sent: ${type} to ${recipients.join(', ')}`);
    console.log(`   Payload:`, payload);

    return notification;
  }

  async getAll(): Promise<any[]> {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        return await NotificationModel.find().lean();
      } catch (err) {
        // fallback to in-memory
      }
    }

    return this.store;
  }

  async clear(): Promise<void> {
    this.store = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await NotificationModel.deleteMany({});
      } catch (err) {
        // ignore
      }
    }
  }
}

export const notificationService = new NotificationService();
