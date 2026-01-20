import { AttendanceClient } from "./attendance-client";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Attendance Records
        </h2>
        <p className="text-muted-foreground">
          View and edit attendance records by date
        </p>
      </div>

      <AttendanceClient />
    </div>
  );
}
