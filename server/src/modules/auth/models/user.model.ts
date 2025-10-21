import { Document, Schema, Types, model } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  role: "admin" | "authority" | "collector" | "resident";
}

const UserSchema: Schema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "authority", "collector", "resident"],
      default: "resident",
    },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("User", UserSchema);
