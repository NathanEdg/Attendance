import { db, members, attendanceRecords } from "@/lib/db";
import { count, countDistinct, eq } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Users, CalendarCheck, Calendar, TrendingUp } from "lucide-react";

async function getStats() {
  const today = new Date().toISOString().split("T")[0];

  const [totalMembers] = await db.select({ count: count() }).from(members);

  const [todayAttendance] = await db
    .select({ count: count() })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.date, today!));

  const [totalDays] = await db
    .select({ count: countDistinct(attendanceRecords.date) })
    .from(attendanceRecords);

  const [totalCheckins] = await db
    .select({ count: count() })
    .from(attendanceRecords);

  const avgAttendance =
    totalMembers?.count && totalDays?.count
      ? (
          ((totalCheckins?.count || 0) /
            (totalMembers.count * totalDays.count)) *
          100
        ).toFixed(1)
      : "0";

  return {
    totalMembers: totalMembers?.count || 0,
    todayAttendance: todayAttendance?.count || 0,
    totalDays: totalDays?.count || 0,
    avgAttendance,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your attendance system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Registered members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Check-ins
            </CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAttendance}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalMembers > 0
                ? `${((stats.todayAttendance / stats.totalMembers) * 100).toFixed(0)}% of members`
                : "No members yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDays}</div>
            <p className="text-xs text-muted-foreground">
              Days with attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Attendance
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Overall attendance rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
