import mongoose, { Schema, type InferSchemaType } from "mongoose";

const bankAccountSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bankId: { type: String, required: true },
    accountId: { type: String, required: true },
    accessToken: { type: String, required: true, select: false },
    fundingSourceUrl: { type: String, required: true },
    shareableId: { type: String, required: true },
  },
  { timestamps: true },
);

export type BankAccountRecord = InferSchemaType<typeof bankAccountSchema>;

const BankAccount =
  mongoose.models.BankAccount ??
  mongoose.model<BankAccountRecord>("BankAccount", bankAccountSchema);

export default BankAccount;
