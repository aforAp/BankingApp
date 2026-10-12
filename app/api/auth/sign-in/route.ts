"use server";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth-security";
import { connectToDatabase } from "@/lib/mongodb";
import { authFormSchema, encryptId, parseStringify } from "@/lib/utils";
import User from "@/models/User";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
  type LinkTokenCreateRequest,
} from "plaid";
import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource } from "@/lib/dwolla.actions";
import BankAccount from "@/models/BankAccount";

const signInSchema = authFormSchema("sign-in");

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please correct the sign-in details and try again." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({
      email: parsed.data.email.trim().toLowerCase(),
    }).select("+passwordHash firstname lastname email");

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const loggedInUserId = user._id.toString();
    const response = NextResponse.json(
      {
        message: "Sign-in successful.",
        data: {
          id: loggedInUserId,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
        },
      },
      { status: 200 },
    );
    response.cookies.set("session", createSessionToken(loggedInUserId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error(
      "Sign-in failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      { message: "Unable to sign in right now." },
      { status: 500 },
    );
  }
}

export async function getLoggedInUser() {
 const token = (await cookies()).get('session')?.value;
 if(!token) return null;
 const session = verifySessionToken(token);
 if(!session) return null;
  await connectToDatabase();
  const user = await User.findById(session.sub)
  .select("firstname lastname email dwollaCustomerId");
  if(!user) redirect('/sign-up');
  return parseStringify(user);
}

export async function logoutAccount () {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return { message: "Logged out successfully." };
}

export const createLinkToken = async () => {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error("You must be signed in to connect a bank account.");
  }

  try {
    const tokenParams: LinkTokenCreateRequest = {
      user: {
        client_user_id: String(user._id),
      },
      client_name: `${user.firstname} ${user.lastname}`,
      products: ["auth", "transactions"] as Products[],
      language: "en",
      country_codes: ['US'] as CountryCode[],
    };
    const response = await plaidClient.linkTokenCreate(tokenParams);
    return { linkToken: response.data.link_token };
  } catch (error) {
    console.error(
      "Failed to create Plaid Link token:",
      error instanceof Error ? error.name : "Unknown error",
    );
    throw new Error("Unable to start bank connection. Please try again.");
  }
}

export const createTransactionsUpdateLinkToken = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error("You must be signed in to update bank permissions.");
  }

  try {
    await connectToDatabase();
    const bank = await BankAccount.findOne({
      accountId,
      userId: user._id,
    }).select("+accessToken");

    if (!bank) {
      throw new Error("Bank account not found for the signed-in user.");
    }

    const tokenParams: LinkTokenCreateRequest = {
      user: {
        client_user_id: String(user._id),
      },
      client_name: `${user.firstname} ${user.lastname}`,
      access_token: bank.accessToken,
      additional_consented_products: ["transactions"] as Products[],
      language: "en",
      country_codes: ["US"] as CountryCode[],
    };
    const response = await plaidClient.linkTokenCreate(tokenParams);
    return { linkToken: response.data.link_token };
  } catch (error) {
    console.error(
      "Failed to create Plaid transactions consent link token:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error("Unable to request Transactions access for this bank.");
  }
};

export const exchangePublicToken = async ({ publicToken }: { publicToken: string }) => {
  try {
    const user = await getLoggedInUser();
    if (!user) {
      throw new Error("You must be signed in to connect a bank account.");
    }
    if (!user.dwollaCustomerId) {
      throw new Error("No Dwolla customer is associated with this account.");
    }

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    const accountResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountResponse.data.accounts[0];
    if (!accountData) {
      throw new Error("Plaid did not return a bank account.");
    }

    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: ProcessorTokenCreateRequestProcessorEnum.Dwolla,
    };
    const processorTokenResponse = await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    if (!fundingSourceUrl) {
      throw new Error("Dwolla did not create a funding source.");
    }

    const bankAccount = new BankAccount({
      userId: user._id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });
    await bankAccount.save();
    revalidatePath("/");

    return { publicTokenExchange: "complete" };
  } catch (error) {
    console.error(
      "Failed to exchange Plaid public token:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw new Error("Unable to finish connecting your bank. Please try again.");
  }
};