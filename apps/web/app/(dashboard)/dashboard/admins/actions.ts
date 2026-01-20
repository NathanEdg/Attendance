"use server";

import { db } from "@/lib/db";
import { users, accounts } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Get current session and verify admin
async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Check if user is admin
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user?.isAdmin) {
    throw new Error("Not authorized");
  }

  return session;
}

export async function getAdmins() {
  await requireAdmin();

  const adminUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.isAdmin, true))
    .orderBy(desc(users.createdAt));

  return adminUsers;
}

export async function createAdmin(data: {
  name: string;
  email: string;
  password: string;
}) {
  await requireAdmin();

  const { name, email, password } = data;

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required" };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" };
    }

    // Use better-auth's signUp to create the user with hashed password
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!result?.user?.id) {
      return { success: false, error: "Failed to create user" };
    }

    // Update the user to be an admin
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, result.user.id));

    revalidatePath("/dashboard/admins");
    return { success: true };
  } catch (error) {
    console.error("Error creating admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create admin",
    };
  }
}

export async function deleteAdmin(adminId: string) {
  const session = await requireAdmin();

  // Prevent deleting yourself
  if (session.user.id === adminId) {
    return { success: false, error: "You cannot delete your own account" };
  }

  try {
    // Check if this is the last admin
    const adminCount = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isAdmin, true));

    if (adminCount.length <= 1) {
      return {
        success: false,
        error: "Cannot delete the last admin account",
      };
    }

    // Delete the user (cascades to sessions and accounts)
    await db.delete(users).where(eq(users.id, adminId));

    revalidatePath("/dashboard/admins");
    return { success: true };
  } catch (error) {
    console.error("Error deleting admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete admin",
    };
  }
}
