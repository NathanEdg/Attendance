import { CheckInClient } from "./check-in-client";

export default function CheckInPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Check In</h2>
        <p className="text-muted-foreground">
          Scan member QR codes to record attendance
        </p>
      </div>

      <CheckInClient />
    </div>
  );
}
