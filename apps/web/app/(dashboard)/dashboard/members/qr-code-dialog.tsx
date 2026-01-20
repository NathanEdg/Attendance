"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Download } from "lucide-react";

type Member = {
  id: string;
  name: string;
};

export function QRCodeDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (member?.id && open) {
      QRCode.toDataURL(member.id, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      }).then(setQrDataUrl);
    }
  }, [member?.id, open]);

  const handleDownload = () => {
    if (!qrDataUrl || !member) return;

    const link = document.createElement("a");
    link.download = `qr-${member.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {member.name}</DialogTitle>
          <DialogDescription>
            Scan this QR code to check in. The code contains the member ID.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-6">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${member.name}`}
              className="rounded-lg border"
            />
          ) : (
            <div className="size-[300px] animate-pulse rounded-lg bg-muted" />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={!qrDataUrl}>
            <Download className="mr-2 size-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
