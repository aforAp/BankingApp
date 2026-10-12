"use server";

import BankAccount from "@/models/BankAccount";
import { connectToDatabase } from "./mongodb";
import { parseStringify } from "./utils";

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    await connectToDatabase();

    const banks = await BankAccount.find({ userId }).select("+accessToken");
    return parseStringify(banks);
  } catch (error) {
    console.error("Failed to get banks for user:", error);
    throw new Error("Unable to retrieve the user's banks.");
  }
};

export const getBank = async ({ accountId }: getBankProps) => {
  try {
    await connectToDatabase();

    const bank = await BankAccount.findOne({ accountId }).select("+accessToken");
    if (!bank) {
      throw new Error("Bank account not found.");
    }

    return parseStringify(bank);
  } catch (error) {
    console.error("Failed to get bank:", error);
    throw new Error("Unable to retrieve the bank account.");
  }
};
