"use server";

import { db, members, attendanceRecords } from "@/lib/db";
import { eq, count, countDistinct } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export async function createMember(data: { name: string; email?: string }) {
  const id = nanoid();

  await db.insert(members).values({
    id,
    name: data.name,
    email: data.email || null,
  });

  revalidatePath("/dashboard/members");
  return { id };
}

export async function updateMember(
  id: string,
  data: { name: string; email?: string },
) {
  await db
    .update(members)
    .set({
      name: data.name,
      email: data.email || null,
      updatedAt: new Date(),
    })
    .where(eq(members.id, id));

  revalidatePath("/dashboard/members");
}

export async function deleteMember(id: string) {
  await db.delete(members).where(eq(members.id, id));
  revalidatePath("/dashboard/members");
}

export async function getMembersWithAttendance() {
  const allMembers = await db.select().from(members).orderBy(members.name);

  // Get total days with any attendance
  const [totalDaysResult] = await db
    .select({ count: countDistinct(attendanceRecords.date) })
    .from(attendanceRecords);
  const totalDays = totalDaysResult?.count || 0;

  // Get attendance count for each member
  const memberAttendance = await db
    .select({
      memberId: attendanceRecords.memberId,
      count: count(),
    })
    .from(attendanceRecords)
    .groupBy(attendanceRecords.memberId);

  const attendanceMap = new Map(
    memberAttendance.map((a) => [a.memberId, a.count]),
  );

  return allMembers.map((member) => {
    const daysAttended = attendanceMap.get(member.id) || 0;
    const attendancePercentage =
      totalDays > 0 ? Math.round((daysAttended / totalDays) * 100) : 0;

    return {
      ...member,
      daysAttended,
      totalDays,
      attendancePercentage,
    };
  });
}
