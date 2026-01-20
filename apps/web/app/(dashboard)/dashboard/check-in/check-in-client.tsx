"use client";

import { useEffect, useState } from "react";
import { QRScanner } from "./qr-scanner";
import { getTodayAttendance } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { format } from "date-fns";

type AttendanceRecord = {
  id: string;
  memberId: string;
  memberName: string;
  checkedInAt: Date;
};

export function CheckInClient() {
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);

  const loadTodayAttendance = async () => {
    const records = await getTodayAttendance();
    setTodayRecords(records);
  };

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <QRScanner onCheckIn={loadTodayAttendance} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today&apos;s Check-ins</CardTitle>
              <CardDescription>
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {todayRecords.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No check-ins yet today
                    </TableCell>
                  </TableRow>
                ) : (
                  todayRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.memberName}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.checkedInAt), "h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
