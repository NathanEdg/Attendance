import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, name, setupKey } = await request.json();

    // Simple setup key protection - in production, use a more secure method
    if (setupKey !== "setup-admin-2024") {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 403 });
    }

    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true))
      .limit(1);

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin user already exists" },
        { status: 400 },
      );
    }

    // Create the user using better-auth's signUp
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!result.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    // Update user to be admin
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, result.user.id));

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      user: { id: result.user.id, email: result.user.email },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 },
    );
  }
}

export async function GET() {
  // Check if admin exists
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.isAdmin, true))
    .limit(1);

  return NextResponse.json({
    adminExists: !!existingAdmin,
  });
}
