import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import type { Invoice, InvoiceStatus } from "../types/payment";
import { useQuery } from "@tanstack/react-query";
import {
  apiGetMyInvoices,
  type GetMyInvoicesParams,
} from "../../../api/payment/invoice.api";
import { PageSkeleton } from "../../../components/LoadingSkeleton";
import {
  exportInvoicesCsv,
  exportInvoicesPdf,
} from "../services/exportInvoices";

interface BillingDashboardProps {
  onPayNow: (invoice: Invoice) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export function BillingDashboard({
  onPayNow,
  onViewInvoice,
}: BillingDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch invoices from backend for logged-in resident
  type BackendStatus = GetMyInvoicesParams["status"];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoices", "me", { tab: activeTab }],
    queryFn: async () => {
      // Backend statuses are Title Case; map from UI tab values
      const statusMap: Record<string, BackendStatus | undefined> = {
        all: undefined,
        pending: "Pending",
        partially_paid: "Partially Paid",
        paid: "Paid",
        refunded: "Refunded",
      };
      const status: BackendStatus | undefined = statusMap[activeTab];
      return apiGetMyInvoices(status ? { status } : undefined);
    },
    // Refetch when tab changes; cache handled globally in QueryClient
  });

  // Map backend DTOs to UI Invoice type
  const invoices: Invoice[] = useMemo(() => {
    const raw = data ?? [];
    const toUiStatus = (s: string): InvoiceStatus => {
      switch (s) {
        case "Pending":
          return "pending";
        case "Paid":
          return "paid";
        case "Refunded":
          return "refunded";
        case "Partially Paid":
          return "partially_paid";
        default:
          return "pending"; // fallback
      }
    };
    const toUiReason = (r: string): Invoice["reason"] => {
      const normalized = (r || "").toLowerCase();
      if (normalized.includes("overweight")) return "Overweight Bin";
      if (normalized.includes("special")) return "Special Collection";
      if (normalized.includes("subscription")) return "Subscription Renewal";
      if (normalized.includes("late")) return "Late Fee";
      // default mapping
      return "Overweight Bin";
    };
    return raw.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.id, // no separate number from backend yet
      dateIssued: inv.createdAt,
      dueDate: inv.dueDate ?? inv.createdAt,
      amount: inv.amount,
      paidToDate: (inv as any).paidToDate ?? undefined,
      outstanding: (inv as any).outstanding ?? undefined,
      reason: toUiReason(inv.reason),
      originatingUseCase: "Payments",
      status: toUiStatus(inv.status),
      // lateFee/discount are not provided by backend Phase 2
    }));
  }, [data]);

  // no-op

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          Failed to load invoices. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 mb-2">Billing & Payments</h1>
        <p className="text-gray-600">
          Manage your invoices, payments, and receipts.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 mb-1" style={{ fontSize: "14px" }}>
            Total Outstanding
          </p>
          <p
            className="text-gray-900"
            style={{ fontSize: "24px", fontWeight: "600" }}
          >
            {formatCurrency(
              invoices
                .filter((i) => i.status === "pending")
                .reduce((sum, i) => sum + i.amount, 0)
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 mb-1" style={{ fontSize: "14px" }}>
            Overdue
          </p>
          <p
            className="text-red-600"
            style={{ fontSize: "24px", fontWeight: "600" }}
          >
            {formatCurrency(
              0 // overdue not provided by backend yet
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 mb-1" style={{ fontSize: "14px" }}>
            Paid This Month
          </p>
          <p
            className="text-green-700"
            style={{ fontSize: "24px", fontWeight: "600" }}
          >
            {formatCurrency(
              invoices
                .filter((i) => i.status === "paid")
                .slice(0, 3)
                .reduce((sum, i) => sum + i.amount, 0)
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 mb-1" style={{ fontSize: "14px" }}>
            Total Invoices
          </p>
          <p
            className="text-gray-900"
            style={{ fontSize: "24px", fontWeight: "600" }}
          >
            {invoices.length}
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="partially_paid">Partially Paid</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="refunded">Refunded</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportInvoicesPdf(invoices)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportInvoicesCsv(invoices)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <button
                          onClick={() => onViewInvoice(invoice)}
                          className="text-gray-900 hover:underline flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          {invoice.invoiceNumber}
                        </button>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(invoice.dateIssued)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {invoice.reason}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {(invoice.status === "pending" ||
                          invoice.status === "partially_paid") && (
                          <Button
                            size="sm"
                            onClick={() => onPayNow(invoice)}
                            className="bg-green-700 hover:bg-green-800 text-white"
                          >
                            {invoice.status === "partially_paid" &&
                            invoice.outstanding
                              ? `Pay Remaining (${formatCurrency(
                                  invoice.outstanding
                                )})`
                              : "Pay Now"}
                          </Button>
                        )}
                        {invoice.status === "paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewInvoice(invoice)}
                          >
                            View Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
