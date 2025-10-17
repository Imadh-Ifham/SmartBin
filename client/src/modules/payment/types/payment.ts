export type InvoiceStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "refunded"
  | "overdue";

export type InvoiceReason =
  | "Overweight Bin"
  | "Special Collection"
  | "Subscription Renewal"
  | "Late Fee";

export type PaymentMethod = "card" | "bank_transfer" | "digital_wallet";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  dateIssued: string;
  dueDate: string;
  amount: number;
  reason: InvoiceReason;
  originatingUseCase: string;
  status: InvoiceStatus;
  lateFee?: number;
  discount?: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  timestamp: string;
  status: "success" | "failed";
  failureReason?: string;
}

export interface RefundRequest {
  invoiceId: string;
  reason: string;
  attachment?: File;
}
