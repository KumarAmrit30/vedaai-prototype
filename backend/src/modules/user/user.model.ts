import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";
import { USER_PLANS, type User as UserEntity } from "./user.types";

const userUsageSchema = new Schema(
  {
    assignmentsGenerated: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    displayName: { type: String, trim: true },
    photoURL: { type: String, trim: true },
    plan: {
      type: String,
      enum: USER_PLANS,
      required: true,
      default: "free",
    },
    usage: {
      type: userUsageSchema,
      required: true,
      default: () => ({ assignmentsGenerated: 0 }),
    },
  },
  { timestamps: true },
);

userSchema.index({ firebaseUid: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

export type UserDocument = HydratedDocument<UserEntity>;
export type UserModel = Model<UserEntity>;

export const User = mongoose.model<UserEntity>("User", userSchema);
