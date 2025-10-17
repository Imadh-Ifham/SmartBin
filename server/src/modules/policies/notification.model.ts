import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: string;
  recipients: string[];
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: true,
      index: true,
    },
    recipients: {
      type: [String],
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model<INotification>('Notification', notificationSchema);
