"use server";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth-security";
import { connectToDatabase } from "@/lib/mongodb";
import { authFormSchema, parseStringify } from "@/lib/utils";
import User from "@/models/User";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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