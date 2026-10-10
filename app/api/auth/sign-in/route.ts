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
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum } from "plaid";
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
 console.log("the session");
 console.log(session);
 if(!session) return null;
  await connectToDatabase();
  const user = await User.findById(session.sub)
  .select("firstname lastname email");
console.log('the user');
console.log(user);
  if(!user) redirect('/sign-up');
  return parseStringify(user);
}

export async function logoutAccount () {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return { message: "Logged out successfully." };
}

export const createLinkToken = async (user: User) => {
  try {
   const tokenParams = {
    user: {
      client_user_id: user._id,
    },
    client_name: user.name,
    products: ['auth'] as Products[],
    language: 'en',
    country_codes: ['US'] as CountryCode[],
   }
   const response = await plaidClient.linkTokenCreate(tokenParams);
   return parseStringify({
    linkToken: response.data.link_token
   })
  }
  catch (error) {
    console.log(error);
  }
}

export const createBankAccount = async({userId, bankId, accountId, accessToken, fundingSourceUrl, shareableId}: createBankAccountProps) => {
  try {
     const bankAccount = new BankAccount({
      userId, bankId, accountId, accessToken, fundingSourceUrl, shareableId
     });

     return bankAccount;
  }  catch(error) {

  }
}
export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken
    });
    //once we generated the token we need to change that to public token

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    //Get account Information frok plaid using the access token
    const accountResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountResponse.data.accounts[0];

    //Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    }
    const processorTokenResponse = await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    //Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    //if  the funding source URL is not created, throw an error.
    if(!fundingSourceUrl) throw Error;

    //create a bank account using the user ID, item ID, account ID, acc
    await createBankAccount({
      userId: user._id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });
    //revalidate the path to reflect the changes
    revalidatePath("/");

    //return a success message
    return parseStringify({
      publicTokenExchange: "complete",
    });
  }
  catch (error) {
    console.log(error);
  }
}

