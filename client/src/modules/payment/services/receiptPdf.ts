import jsPDF from "jspdf";
import type { Invoice, Payment } from "../types/payment";

export interface OrgInfo {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  supportEmail?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(
    amount
  );

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const methodLabel = (m: Payment["method"]) =>
  ({
    card: "Credit/Debit Card",
    bank_transfer: "Bank Transfer",
    digital_wallet: "Digital Wallet",
  }[m] || m);

export function generateReceiptPdf(
  invoice: Invoice,
  payment: Payment,
  org: OrgInfo = {}
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  doc.setFillColor(17, 24, 39); // gray-900
  doc.rect(0, 0, pageWidth, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(org.name || "SmartBin", margin, 50);

  // Title
  y = 110;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(22);
  doc.text("Payment Receipt", margin, y);
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.line(margin, y + 10, pageWidth - margin, y + 10);
  y += 30;

  // Top meta (Invoice No / Payment ID / Date)
  doc.setFontSize(12);
  const col1X = margin;
  const col2X = pageWidth / 2;

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Number", col1X, y);
  doc.text("Payment ID", col2X, y);
  doc.setFont("helvetica", "normal");
  y += 16;
  doc.text(invoice.invoiceNumber, col1X, y);
  doc.text(payment.id, col2X, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.text("Date & Time", col1X, y);
  doc.text("Payment Method", col2X, y);
  doc.setFont("helvetica", "normal");
  y += 16;
  doc.text(formatDateTime(payment.timestamp), col1X, y);
  doc.text(methodLabel(payment.method), col2X, y);
  y += 30;

  // Details box
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 120, 6, 6);
  let dy = y + 20;
  const left = margin + 16;
  const right = pageWidth - margin - 16;

  const addRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, left, dy);
    doc.setFont("helvetica", "normal");
    doc.text(value, right, dy, { align: "right" });
    dy += 22;
  };

  addRow("Invoice Reason", invoice.reason);
  const subtotal = invoice.outstanding ?? invoice.amount;
  addRow("Subtotal", formatCurrency(subtotal));
  if (invoice.discount)
    addRow("Discount", `- ${formatCurrency(invoice.discount)}`);
  if (invoice.lateFee) addRow("Late Fee", formatCurrency(invoice.lateFee));
  addRow("Amount Paid", formatCurrency(payment.amount));

  // Footer / support note
  const noteY = y + 140;
  doc.setFontSize(10);
  const support = org.supportEmail || "support@smartbin.local";
  const ref = payment.id;
  const note = `A detailed receipt has been sent to your email. If you have any questions about this transaction, please contact our support team at ${support} with your Payment ID: ${ref}`;
  doc.setTextColor(30, 64, 175); // blue-800
  doc.text(note, margin, noteY, { maxWidth: pageWidth - margin * 2 });

  // Address
  doc.setTextColor(55, 65, 81); // gray-700
  doc.setFontSize(9);
  const addr = [org.addressLine1, org.addressLine2].filter(Boolean).join(" · ");
  const pageHeight = doc.internal.pageSize.getHeight();
  if (addr) doc.text(addr, margin, pageHeight - 40);

  const filename = `Receipt_${invoice.invoiceNumber || payment.invoiceId}.pdf`;
  doc.save(filename);
}
