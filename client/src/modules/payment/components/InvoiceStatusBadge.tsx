import { Badge } from "./ui/badge";
import type { InvoiceStatus } from "../types/payment";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const statusConfig: Record<
    InvoiceStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pending",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    partially_paid: {
      label: "Partially Paid",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    paid: {
      label: "Paid",
      className: "bg-green-50 text-green-700 border-green-200",
    },
    refunded: {
      label: "Refunded",
      className: "bg-purple-50 text-purple-700 border-purple-200",
    },
    overdue: {
      label: "Overdue",
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const config = statusConfig[status];

  return <Badge className={config.className}>{config.label}</Badge>;
}

export default InvoiceStatusBadge;
