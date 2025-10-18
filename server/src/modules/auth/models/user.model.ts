import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  role: "admin" | "authority" | "collector" | "resident";
  residentId?: string;
  collectorId?: string;
  authorityId?: string;
  adminId?: string;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "authority", "collector", "resident"],
      default: "resident",
    },
    residentId: { type: String },
    collectorId: { type: String },
    authorityId: { type: String },
    adminId: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
