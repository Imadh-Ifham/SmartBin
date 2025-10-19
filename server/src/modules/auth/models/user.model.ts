import { Document, Schema, Types, model } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  role: "admin" | "authority" | "collector" | "resident";
  name: string;
  email: string;
  phone: string;
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
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    residentId: { type: String },
    collectorId: { type: String },
    authorityId: { type: String },
    adminId: { type: String },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("User", UserSchema);
