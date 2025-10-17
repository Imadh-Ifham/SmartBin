export interface FeedbackItem {
  stakeholderType: string;
  message?: string;
  date: string;
}

import mongoose from 'mongoose';
import { FeedbackModel } from './feedback.model';

export class FeedbackService {
  // store in-memory for mock/demo purposes when DB not available
  private store: Record<string, FeedbackItem[]> = {};

  async addFeedback(policyId: string, item: FeedbackItem) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // persist to DB
      try {
        await FeedbackModel.create({ policyId, stakeholderType: item.stakeholderType, message: item.message, date: item.date });
        return item;
      } catch (err) {
        // fallback to in-memory
      }
    }

    const items = this.store[policyId] ?? (this.store[policyId] = []);
    items.push(item);
    return item;
  }

  async getSummary(policyId: string) {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const count = await FeedbackModel.countDocuments({ policyId });
        const last = await FeedbackModel.findOne({ policyId }).sort({ date: -1 }).lean();
        return { count, lastRequested: last ? last.date : null };
      } catch (err) {
        // fallback to in-memory
      }
    }

    const items = this.store[policyId] ?? [];
    const lastRequested = items.length ? items[items.length - 1]!.date : null;
    return { count: items.length, lastRequested };
  }
}

export const feedbackService = new FeedbackService();
