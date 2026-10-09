import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true, uppercase: true },
    postalcode: { type: String, required: true, trim: true },
    dob: { type: String, required: true },
    ssnEncrypted: { type: String, required: true, select: false },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    dwollaCustomerUrl: {
      type: String,
      required: false,    
    },
    dwallowCustomerId: {
      type: String,
      required: false
    }
  },
  { timestamps: true },
);

export type UserRecord = InferSchemaType<typeof userSchema>;

const User =
  mongoose.models.User ?? mongoose.model<UserRecord>("User", userSchema);

export default User;
