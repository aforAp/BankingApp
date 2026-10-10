'use server';
import { NextResponse } from "next/server";
import { authFormSchema, extractCustomerIdFromUrl } from "@/lib/utils";
import { connectToDatabase } from "@/lib/mongodb";
import { encryptSsn, hashPassword } from "@/lib/auth-security";
import User from "@/models/User";
import { createDwollaCustomer } from "@/lib/dwolla.actions";


const signUpSchema = authFormSchema("sign-up");

export async function POST(request: Request) {
  
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please correct the signup details and try again." },
      { status: 400 },
    );
  }
  const data = parsed.data;
  if (
    data.firstname === undefined ||
    data.lastname === undefined ||
    data.address === undefined ||
    data.city === undefined ||
    data.state === undefined ||
    data.postalcode === undefined ||
    data.dob === undefined ||
    data.ssn === undefined
  ) {
    return NextResponse.json(
      { message: "Please provide all required signup details." },
      { status: 400 },
    );
  }

  let stage = "MongoDB connection";
  try {
    await connectToDatabase();

    const email = data.email.trim().toLowerCase();
    if (await User.exists({ email })) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    stage = "password hashing";
    const passwordHash = await hashPassword(data.password);
    stage = "SSN encryption";
    const ssnEncrypted = encryptSsn(data.ssn);
    stage = "Dwolla customer creation";
    const dwollaCustomerUrl = await createDwollaCustomer({
      firstName: data.firstname,
      lastName: data.lastname,
      address1: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postalcode,
      dateOfBirth: data.dob,
      ssn: data.ssn,
      email,
      type: "personal",
    });

    if (!dwollaCustomerUrl) throw new Error("Error creating Dwolla customer.");

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);
    stage = "MongoDB user creation";
    const user = new User({
      firstname: data.firstname,
      lastname: data.lastname,
      address: data.address,
      city: data.city,
      state: data.state,
      postalcode: data.postalcode,
      dob: data.dob,
      ssnEncrypted,
      dwollaCustomerUrl,
      dwollaCustomerId,
      email,
      passwordHash,
    });
    await user.save();

    return NextResponse.json(
      { message: "Account created successfully." },
      { status: 201 },
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error(
      `Signup failed during ${stage}:`,
      error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error",
    );
    return NextResponse.json(
      { message: "Unable to create your account right now." },
      { status: 500 },
    );
  }
}
