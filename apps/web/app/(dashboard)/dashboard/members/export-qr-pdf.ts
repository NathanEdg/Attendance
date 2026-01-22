"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";

type Member = {
  id: string;
  name: string;
};

export async function generateQRCodesPDF(members: Member[]): Promise<void> {
  // Create PDF in portrait letter size
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
  });

  const pageWidth = 8.5;

  for (let i = 0; i < members.length; i++) {
    const member = members[i]!;

    if (i > 0) {
      pdf.addPage();
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(member.id, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Title: "Spike 293" - centered at top
    pdf.setFontSize(48);
    pdf.setFont("helvetica", "bold");
    const title = "Spike 293";
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 2);

    // QR Code - centered in middle of page
    const qrSize = 4; // 4 inches square
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 3;
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // Member name - centered below QR code
    pdf.setFontSize(36);
    pdf.setFont("helvetica", "normal");
    const nameWidth = pdf.getTextWidth(member.name);
    pdf.text(member.name, (pageWidth - nameWidth) / 2, qrY + qrSize + 1);
  }

  // Save the PDF
  pdf.save("spike-293-member-qr-codes.pdf");
}
