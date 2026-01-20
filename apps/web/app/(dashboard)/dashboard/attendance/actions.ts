"use server";

import { db, members, attendanceRecords } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export async function getAttendanceDays() {
  const days = await db
    .selectDistinct({ date: attendanceRecords.date })
    .from(attendanceRecords)
    .orderBy(desc(attendanceRecords.date));

  return days.map((d) => d.date);
}

export async function getAttendanceForDate(date: string) {
  const allMembers = await db.select().from(members).orderBy(members.name);

  const records = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.date, date));

  const attendanceMap = new Map(records.map((r) => [r.memberId, r]));

  return allMembers.map((member) => {
    const record = attendanceMap.get(member.id);
    return {
      memberId: member.id,
      memberName: member.name,
      present: !!record,
      recordId: record?.id || null,
      checkedInAt: record?.checkedInAt || null,
    };
  });
}

export async function toggleAttendance(
  memberId: string,
  date: string,
  present: boolean,
) {
  if (present) {
    // Check if record already exists
    const [existing] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.memberId, memberId),
          eq(attendanceRecords.date, date),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(attendanceRecords).values({
        id: nanoid(),
        memberId,
        date,
        checkedInAt: new Date(),
      });
    }
  } else {
    // Delete the attendance record
    await db
      .delete(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.memberId, memberId),
          eq(attendanceRecords.date, date),
        ),
      );
  }

  revalidatePath("/dashboard/attendance");
}

export async function addAttendanceDay(date: string) {
  // Just a placeholder - we don't need to do anything since attendance
  // records are created when marking someone present
  revalidatePath("/dashboard/attendance");
  return { success: true };
}

export async function deleteAttendanceDay(date: string) {
  await db.delete(attendanceRecords).where(eq(attendanceRecords.date, date));

  revalidatePath("/dashboard/attendance");
}

export async function getAllMembers() {
  return await db.select().from(members).orderBy(members.name);
}
