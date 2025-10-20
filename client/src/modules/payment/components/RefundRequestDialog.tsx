import { useState } from "react";
import { FileText, Upload, CheckCircle, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import type { Invoice, Payment } from "../types/payment";
import { generateReceiptPdf } from "../services/receiptPdf";

interface RefundRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onSubmit: (reason: string, attachment?: File) => void;
}

export function RefundRequestDialog({
  open,
  onOpenChange,
  invoice,
  onSubmit,
}: RefundRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const totalAmount =
    invoice.amount + (invoice.lateFee || 0) - (invoice.discount || 0);

  const handleDownloadReceipt = () => {
    // Build a minimal payment stub for PDF generation when viewing a paid invoice
    const payment: Payment = {
      id: `INV-${invoice.id}`,
      invoiceId: invoice.id,
      amount: totalAmount,
      method: "bank_transfer",
      timestamp: new Date().toISOString(),
      status: "success",
    };
    try {
      generateReceiptPdf(invoice, payment, {
        name: "SmartBin",
        addressLine1: "123 Clean Street, Colombo",
        addressLine2: "Sri Lanka",
        supportEmail: "support@smartbin.local",
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to generate receipt PDF", e);
    }
  };

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason, attachment || undefined);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReason("");
        setAttachment(null);
        onOpenChange(false);
      }, 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-10 h-10 text-green-700" />
            </div>
            <h3 className="text-gray-900 mb-2">Request Submitted</h3>
            <p className="text-gray-600">
              Your refund request has been submitted to the Authority. You will
              receive a response within 3-5 business days.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Refund or Dispute</DialogTitle>
          <DialogDescription>
            Submit a refund request or dispute for invoice{" "}
            {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice details */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-900">
                  Invoice: {invoice.invoiceNumber}
                </p>
                <p className="text-gray-600" style={{ fontSize: "14px" }}>
                  {invoice.reason} • {formatCurrency(invoice.amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Reason textarea */}
          <div>
            <Label htmlFor="reason">Reason for Refund/Dispute *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you are requesting a refund or disputing this invoice..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              className="mt-2 resize-none"
            />
            <p className="text-gray-500 mt-1" style={{ fontSize: "12px" }}>
              Minimum 20 characters required
            </p>
          </div>

          {/* File attachment */}
          <div>
            <Label htmlFor="attachment">Supporting Documents (Optional)</Label>
            <div className="mt-2">
              <label
                htmlFor="attachment"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">
                  {attachment ? attachment.name : "Click to upload file"}
                </span>
              </label>
              <input
                id="attachment"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </div>
            <p className="text-gray-500 mt-1" style={{ fontSize: "12px" }}>
              Accepted formats: PDF, JPG, PNG, DOC (Max 5MB)
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDownloadReceipt}>
            <Download className="w-4 h-4 mr-2" />
            Download Receipt (PDF)
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reason.trim().length < 20}
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RefundRequestDialog;
