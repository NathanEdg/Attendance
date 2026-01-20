"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
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
import { Badge } from "@workspace/ui/components/badge";
import { Progress } from "@workspace/ui/components/progress";
import { MoreHorizontal, Pencil, Trash2, QrCode, Plus } from "lucide-react";
import { MemberDialog } from "./member-dialog";
import { QRCodeDialog } from "./qr-code-dialog";
import { deleteMember } from "./actions";

type MemberWithAttendance = {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
  daysAttended: number;
  totalDays: number;
  attendancePercentage: number;
};

export function MembersTable({ members }: { members: MemberWithAttendance[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<MemberWithAttendance | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = (member: MemberWithAttendance) => {
    setSelectedMember(member);
    setDialogOpen(true);
  };

  const handleShowQR = (member: MemberWithAttendance) => {
    setSelectedMember(member);
    setQrDialogOpen(true);
  };

  const handleDelete = (member: MemberWithAttendance) => {
    setSelectedMember(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMember) return;
    setDeleting(true);
    try {
      await deleteMember(selectedMember.id);
      router.refresh();
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedMember(null);
    }
  };

  const handleAddNew = () => {
    setSelectedMember(null);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 size-4" />
          Add Member
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No members found. Add your first member to get started.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={member.attendancePercentage}
                        className="w-20"
                      />
                      <Badge
                        variant={
                          member.attendancePercentage >= 75
                            ? "default"
                            : member.attendancePercentage >= 50
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {member.attendancePercentage}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({member.daysAttended}/{member.totalDays})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShowQR(member)}>
                          <QrCode className="mr-2 size-4" />
                          Show QR Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MemberDialog
        member={selectedMember}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <QRCodeDialog
        member={selectedMember}
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMember?.name}? This will
              also delete all their attendance records. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
