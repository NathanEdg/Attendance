"use server";

import { db, members, attendanceRecords } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function checkInMember(memberId: string) {
  // Find the member
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  const today = new Date().toISOString().split("T")[0]!;

  // Check if already checked in today
  const [existingRecord] = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.memberId, memberId),
        eq(attendanceRecords.date, today),
      ),
    )
    .limit(1);

  if (existingRecord) {
    return {
      success: true,
      alreadyCheckedIn: true,
      member: { id: member.id, name: member.name },
    };
  }

  // Create attendance record
  await db.insert(attendanceRecords).values({
    id: nanoid(),
    memberId: memberId,
    date: today,
    checkedInAt: new Date(),
  });

  return {
    success: true,
    alreadyCheckedIn: false,
    member: { id: member.id, name: member.name },
  };
}

export async function getTodayAttendance() {
  const today = new Date().toISOString().split("T")[0]!;

  const records = await db
    .select({
      id: attendanceRecords.id,
      memberId: attendanceRecords.memberId,
      memberName: members.name,
      checkedInAt: attendanceRecords.checkedInAt,
    })
    .from(attendanceRecords)
    .innerJoin(members, eq(attendanceRecords.memberId, members.id))
    .where(eq(attendanceRecords.date, today))
    .orderBy(attendanceRecords.checkedInAt);

  return records;
}
