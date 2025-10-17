import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  policyId: string;
  stakeholderType: string;
  message?: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    policyId: {
      type: String,
      required: true,
      index: true,
    },
    stakeholderType: {
      type: String,
      enum: ['resident', 'business', 'staff'],
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const FeedbackModel = mongoose.model<IFeedback>('Feedback', feedbackSchema);
