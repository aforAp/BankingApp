'use server';
import { NextResponse } from "next/server";
import { authFormSchema } from "@/lib/utils";
import { connectToDatabase } from "@/lib/mongodb";
import { encryptSsn, hashPassword } from "@/lib/auth-security";
import User from "@/models/User";


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

  try {
    await connectToDatabase();

    const passwordHash = await hashPassword(parsed.data.password);
    const ssnEncrypted = encryptSsn(parsed.data.ssn);

    const user = await User.create({
      firstname: parsed.data.firstname,
      lastname: parsed.data.lastname,
      address: parsed.data.address,
      state: parsed.data.state,
      postalcode: parsed.data.postalcode,
      dob: parsed.data.dob,
      ssnEncrypted,
      email: parsed.data.email,
      passwordHash,
    });

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
      "Signup failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      { message: "Unable to create your account right now." },
      { status: 500 },
    );
  }
}
