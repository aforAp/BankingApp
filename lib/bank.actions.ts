"use server";

import { CountryCode } from "plaid";

import { plaidClient } from "./plaid";
import { parseStringify } from "./utils";

import { getBanks, getBank } from "./user.actions";

// Get multiple bank accounts
export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    // get banks from db
    const banks = await getBanks({ userId });
    const accounts = await Promise.all(
      banks?.map(async (bank: Bank) => {
        // get each account info from plaid
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        });
        const accountData = accountsResponse.data.accounts[0];
        const institutionId = accountsResponse.data.item.institution_id;
        const institution = institutionId
          ? await getInstitution({ institutionId })
          : undefined;

        const account = {
          id: accountData.account_id,
          availableBalance: accountData.balances.available!,
          currentBalance: accountData.balances.current!,
          institutionId: institution?.institution_id,
          name: accountData.name,
          officialName: accountData.official_name,
          mask: accountData.mask!,
          type: accountData.type as string,
          subtype: accountData.subtype! as string,
          mongoBankId: bank._id.toString(),
          shareableId: bank.shareableId,
        };

        return account;
      })
    );

    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

// Get one bank account
export const getAccount = async ({ accountId }: getAccountProps) => {
  try {
    const bank = await getBank({ accountId });

    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });
    const accountData = accountsResponse.data.accounts.find(
      (account) => account.account_id === accountId
    );
    if (!accountData) {
      throw new Error("The requested Plaid account was not found.");
    }

    const institutionId = accountsResponse.data?.item?.institution_id;
    const institution = institutionId
      ? await getInstitution({ institutionId })
      : undefined;

    let transactions: { date: string }[] = [];
    let transactionsUnavailable = false;
    let transactionsConsentRequired = false;
    try {
      transactions = await getTransactions({ accessToken: bank.accessToken });
    } catch (error) {
      transactionsUnavailable = true;
      transactionsConsentRequired =
        error instanceof PlaidTransactionsError &&
        error.code === "ADDITIONAL_CONSENT_REQUIRED";
    }

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution?.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      mongoBankId: bank._id.toString(),
    };

    const allTransactions = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
      transactionsUnavailable,
      transactionsConsentRequired,
    });
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
    throw error;
  }
};

// Get bank info
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const intitution = institutionResponse.data.institution;

    return parseStringify(intitution);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
}: getTransactionsProps) => {
  let hasMore = true;
  let cursor: string | undefined;
  const transactions: { date: string }[] = [];

  try {
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
      });

      const data = response.data;

      transactions.push(...data.added.map((transaction) => ({
        id: transaction.transaction_id,
        name: transaction.name,
        paymentChannel: transaction.payment_channel,
        type: transaction.payment_channel,
        accountId: transaction.account_id,
        amount: transaction.amount,
        pending: transaction.pending,
        category: transaction.category ? transaction.category[0] : "",
        date: transaction.date,
        image: transaction.logo_url,
      })));

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    return parseStringify(transactions);
  } catch (error) {
    const plaidError = getPlaidErrorDetails(error);
    console.error("Plaid transactions request failed:", plaidError);
    const errorCode =
      typeof plaidError === "object" ? plaidError.errorCode : "UNKNOWN";
    throw new PlaidTransactionsError(errorCode);
  }
};

class PlaidTransactionsError extends Error {
  constructor(public readonly code: string) {
    super("Plaid transactions request failed.");
    this.name = "PlaidTransactionsError";
  }
}

const getPlaidErrorDetails = (error: unknown) => {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return error instanceof Error ? error.message : "Unknown error";
  }

  const response = error.response;
  if (!response || typeof response !== "object" || !("data" in response)) {
    return error instanceof Error ? error.message : "Unknown Plaid error";
  }

  const data = response.data;
  if (!data || typeof data !== "object") {
    return error instanceof Error ? error.message : "Unknown Plaid error";
  }

  const details = data as { error_code?: unknown; error_message?: unknown };
  return {
    errorCode:
      typeof details.error_code === "string" ? details.error_code : "Unknown",
    errorMessage:
      typeof details.error_message === "string"
        ? details.error_message
        : "Unknown Plaid error",
  };
};