"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Badge } from "@workspace/ui/components/badge";
import { CalendarIcon, Trash2, Plus } from "lucide-react";
import {
  getAttendanceDays,
  getAttendanceForDate,
  toggleAttendance,
  deleteAttendanceDay,
} from "./actions";
import { cn } from "@workspace/ui/lib/utils";

type MemberAttendance = {
  memberId: string;
  memberName: string;
  present: boolean;
  recordId: string | null;
  checkedInAt: Date | null;
};

export function AttendanceClient() {
  const router = useRouter();
  const [days, setDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<MemberAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newDateOpen, setNewDateOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadDays();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAttendance(selectedDate);
    }
  }, [selectedDate]);

  const loadDays = async () => {
    const result = await getAttendanceDays();
    setDays(result);
    if (result.length > 0 && !selectedDate) {
      setSelectedDate(result[0]!);
    }
    setLoading(false);
  };

  const loadAttendance = async (date: string) => {
    const result = await getAttendanceForDate(date);
    setAttendance(result);
  };

  const handleToggle = async (memberId: string, present: boolean) => {
    if (!selectedDate) return;

    // Optimistic update
    setAttendance((prev) =>
      prev.map((m) => (m.memberId === memberId ? { ...m, present } : m)),
    );

    await toggleAttendance(memberId, selectedDate, present);
  };

  const handleDeleteDay = async () => {
    if (!selectedDate) return;

    await deleteAttendanceDay(selectedDate);
    setDeleteDialogOpen(false);

    // Reload days and select the next available
    const result = await getAttendanceDays();
    setDays(result);
    if (result.length > 0) {
      setSelectedDate(result[0]!);
    } else {
      setSelectedDate(null);
      setAttendance([]);
    }
  };

  const handleAddDate = async () => {
    if (!newDate) return;

    const dateStr = format(newDate, "yyyy-MM-dd");

    // Add to days if not already there
    if (!days.includes(dateStr)) {
      const newDays = [dateStr, ...days].sort((a, b) => b.localeCompare(a));
      setDays(newDays);
    }

    setSelectedDate(dateStr);
    setNewDateOpen(false);
    setNewDate(undefined);
  };

  const presentCount = attendance.filter((m) => m.present).length;
  const totalCount = attendance.length;

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedDate || ""} onValueChange={setSelectedDate}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select a date" />
          </SelectTrigger>
          <SelectContent>
            {days.map((day) => (
              <SelectItem key={day} value={day}>
                {format(parseISO(day), "EEEE, MMM d, yyyy")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={newDateOpen} onOpenChange={setNewDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 size-4" />
              Add Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={newDate} onSelect={setNewDate} />
            <div className="p-3 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewDateOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddDate} disabled={!newDate}>
                Add
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {selectedDate && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {selectedDate ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {format(parseISO(selectedDate), "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <CardDescription>
                  Mark members as present or absent
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {presentCount}/{totalCount}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Present</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Check-in Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No members found. Add members first.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendance.map((member) => (
                      <TableRow key={member.memberId}>
                        <TableCell>
                          <Checkbox
                            checked={member.present}
                            onCheckedChange={(checked) =>
                              handleToggle(member.memberId, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {member.memberName}
                        </TableCell>
                        <TableCell>
                          {member.checkedInAt
                            ? format(new Date(member.checkedInAt), "h:mm a")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CalendarIcon className="mx-auto size-12 mb-4 opacity-50" />
              <p>No attendance days yet.</p>
              <p className="text-sm mt-1">
                Check in members or add a new date to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Day</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all attendance records for{" "}
              {selectedDate && format(parseISO(selectedDate), "MMMM d, yyyy")}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDay}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
