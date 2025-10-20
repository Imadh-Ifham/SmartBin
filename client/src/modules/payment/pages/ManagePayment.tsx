import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "react-hot-toast";
import { DashboardLayout } from "../components/DashboardLayout";
import { BillingDashboard } from "../components/BillingDashboard";
import { PaymentCheckout } from "../components/PaymentCheckout";
import { PaymentSuccess } from "../components/PaymentSuccess";
import { PaymentFailure } from "../components/PaymentFailure";
import { RefundRequestDialog } from "../components/RefundRequestDialog";
import type { Invoice, Payment, PaymentMethod } from "../types/payment";

type Screen = "dashboard" | "checkout" | "success" | "failure";

const ManagePayment = () => {
  const queryClient = useQueryClient();
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [failureReason] = useState<string>("");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  // Optimistically update invoice after a payment (handles full or partial)
  const markInvoiceAfterPaymentOptimistic = (
    invoice: Invoice,
    amountPaid: number
  ) => {
    const entries = queryClient.getQueriesData<any>({ queryKey: ["invoices"] });
    for (const [key, data] of entries) {
      if (!Array.isArray(data)) continue;
      // Determine the current tab from the queryKey (['invoices','me',{tab: 'pending'}])
      let tab: string | undefined;
      if (Array.isArray(key) && typeof key[2] === "object" && key[2] !== null) {
        tab = (key as any)[2]?.tab;
      }
      const next = data
        .map((inv: Invoice) => {
          if (inv.id !== invoice.id) return inv as any;
          const previousOutstanding = inv.outstanding ?? inv.amount;
          const newOutstanding = Math.max(0, previousOutstanding - amountPaid);
          const newStatus = newOutstanding === 0 ? "paid" : "partially_paid";
          return {
            ...inv,
            status: newStatus,
            paidToDate:
              (inv.paidToDate ?? inv.amount - previousOutstanding) + amountPaid,
            outstanding: newOutstanding,
          } as any;
        })
        // If tab is pending and invoice moved to another status, remove it
        .filter((inv: Invoice) => {
          if (inv.id !== invoice.id) return true;
          if (tab === "pending" && inv.status !== "pending") return false;
          return true;
        });
      queryClient.setQueryData(key, next);
    }
    // Kick off background refetch so we stay consistent with server
    queryClient.invalidateQueries({
      queryKey: ["invoices"],
      refetchType: "active",
    });
  };

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentScreen("checkout");
  };

  const handleViewInvoice = (invoice: Invoice) => {
    if (invoice.status === "paid") {
      setSelectedInvoice(invoice);
      setRefundDialogOpen(true);
    }
  };

  const handleConfirmPayment = (method: PaymentMethod, paidAmount: number) => {
    if (!selectedInvoice) return;
    // This method is now called after Stripe confirm in PaymentCheckout; we treat it as success path.
    const payment: Payment = {
      id: `PAY-${Date.now()}`,
      invoiceId: selectedInvoice.id,
      amount: paidAmount,
      method,
      timestamp: new Date().toISOString(),
      status: "success",
    };

    // Update selected invoice for success screen (so receipt shows correct subtotals)
    const prevOutstanding =
      selectedInvoice.outstanding ?? selectedInvoice.amount;
    const newOutstanding = Math.max(0, prevOutstanding - paidAmount);
    const newPaidToDate =
      (selectedInvoice.paidToDate ?? selectedInvoice.amount - prevOutstanding) +
      paidAmount;
    const updatedInvoice: Invoice = {
      ...selectedInvoice,
      status: newOutstanding === 0 ? "paid" : "partially_paid",
      outstanding: newOutstanding,
      paidToDate: newPaidToDate,
    };

    setSelectedInvoice(updatedInvoice);
    setCurrentPayment(payment);
    setCurrentScreen("success");
    // Optimistically reflect updated status/outstanding in caches
    markInvoiceAfterPaymentOptimistic(selectedInvoice, paidAmount);
    toast.success("Payment Successful", { duration: 3000 });
  };

  const handleRetryPayment = () => {
    setCurrentScreen("checkout");
  };

  const handleChangePaymentMethod = () => {
    setCurrentScreen("checkout");
  };

  const handleContactSupport = () => {
    toast("Opening support contact form...");
  };

  const handleBackToInvoices = () => {
    setCurrentScreen("dashboard");
    // Ensure invoices are fresh when returning to dashboard
    queryClient.invalidateQueries({
      queryKey: ["invoices"],
      refetchType: "active",
    });
    setSelectedInvoice(null);
    setCurrentPayment(null);
  };

  // If we leave checkout/success/failure, ensure refund dialog is closed
  useEffect(() => {
    if (currentScreen !== "dashboard" && refundDialogOpen) {
      setRefundDialogOpen(false);
    }
  }, [currentScreen]);

  const handleRefundRequest = (_reason: string, _attachment?: File) => {
    toast.success("Refund Request Submitted");
  };

  return (
    <>
      <DashboardLayout>
        {currentScreen === "dashboard" && (
          <BillingDashboard
            onPayNow={handlePayNow}
            onViewInvoice={handleViewInvoice}
          />
        )}

        {currentScreen === "checkout" && selectedInvoice && (
          <PaymentCheckout
            invoice={selectedInvoice}
            onConfirmPayment={handleConfirmPayment}
            onBack={handleBackToInvoices}
          />
        )}

        {currentScreen === "success" && currentPayment && selectedInvoice && (
          <PaymentSuccess
            payment={currentPayment}
            invoice={selectedInvoice}
            onBackToInvoices={handleBackToInvoices}
          />
        )}

        {currentScreen === "failure" && selectedInvoice && (
          <PaymentFailure
            invoice={selectedInvoice}
            failureReason={failureReason}
            onRetry={handleRetryPayment}
            onChangePaymentMethod={handleChangePaymentMethod}
            onContactSupport={handleContactSupport}
          />
        )}
      </DashboardLayout>

      {selectedInvoice && (
        <RefundRequestDialog
          open={refundDialogOpen}
          onOpenChange={setRefundDialogOpen}
          invoice={selectedInvoice}
          onSubmit={handleRefundRequest}
        />
      )}

      <Toaster position="top-right" />
    </>
  );
};

export default ManagePayment;
