import { getMembersWithAttendance } from "./actions";
import { MembersTable } from "./members-table";

export default async function MembersPage() {
  const members = await getMembersWithAttendance();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Members</h2>
        <p className="text-muted-foreground">
          Manage members and view their attendance records
        </p>
      </div>

      <MembersTable members={members} />
    </div>
  );
}
