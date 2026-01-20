import { redirect } from "next/navigation";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

// Force dynamic rendering - this page checks the database
export const dynamic = "force-dynamic";

export default async function Home() {
  // Check if any admin exists
  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.isAdmin, true))
    .limit(1);

  if (!admin) {
    // Redirect to setup if no admin exists
    redirect("/setup");
  }

  // Redirect to login/dashboard
  redirect("/dashboard");
}
