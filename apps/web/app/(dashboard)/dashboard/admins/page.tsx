import { getAdmins } from "./actions";
import { AdminsClient } from "./admins-client";

export default async function AdminsPage() {
  const admins = await getAdmins();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Manage admin users who can access this dashboard
        </p>
      </div>

      <AdminsClient admins={admins} />
    </div>
  );
}
