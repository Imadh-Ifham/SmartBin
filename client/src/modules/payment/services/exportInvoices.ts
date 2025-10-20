import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "../types/payment";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(
    amount
  );

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export function exportInvoicesCsv(invoices: Invoice[]) {
  const headers = [
    "Invoice ID",
    "Date Issued",
    "Due Date",
    "Reason",
    "Total Amount",
    "Paid To Date",
    "Outstanding",
    "Status",
  ];
  const rows = invoices.map((i) => [
    i.invoiceNumber,
    formatDate(i.dateIssued),
    formatDate(i.dueDate),
    i.reason,
    formatCurrency(i.amount),
    formatCurrency(
      i.paidToDate ?? Math.max(0, i.amount - (i.outstanding ?? i.amount))
    ),
    formatCurrency(
      i.outstanding ?? Math.max(0, i.amount - (i.paidToDate ?? 0))
    ),
    i.status,
  ]);

  const escape = (v: string) =>
    /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escape(String(cell))).join(","))
    .join("\r\n");

  // Prepend BOM so Excel opens UTF-8 correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoices_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportInvoicesPdf(invoices: Invoice[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Invoices Report", margin, 45);

  // Subtitle
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 95);

  // Table
  autoTable(doc, {
    startY: 110,
    head: [
      [
        "Invoice ID",
        "Date Issued",
        "Due Date",
        "Reason",
        "Total",
        "Paid",
        "Outstanding",
        "Status",
      ],
    ],
    body: invoices.map((i) => [
      i.invoiceNumber,
      formatDate(i.dateIssued),
      formatDate(i.dueDate),
      i.reason,
      formatCurrency(i.amount),
      formatCurrency(
        i.paidToDate ?? Math.max(0, i.amount - (i.outstanding ?? i.amount))
      ),
      formatCurrency(
        i.outstanding ?? Math.max(0, i.amount - (i.paidToDate ?? 0))
      ),
      i.status,
    ]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: margin, right: margin },
  });

  doc.save(`Invoices_${new Date().toISOString().slice(0, 10)}.pdf`);
}
