import { useEffect, useState } from "react";
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
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [failureReason, setFailureReason] = useState<string>("");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

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

  const handleConfirmPayment = (method: PaymentMethod) => {
    if (!selectedInvoice) return;

    // Simulate payment processing with 70% success rate
    const isSuccess = Math.random() > 0.3;

    if (isSuccess) {
      const payment: Payment = {
        id: `PAY-${Date.now()}`,
        invoiceId: selectedInvoice.id,
        amount: selectedInvoice.amount + (selectedInvoice.lateFee || 0),
        method,
        timestamp: new Date().toISOString(),
        status: "success",
      };

      setCurrentPayment(payment);
      setCurrentScreen("success");

      toast.success("Payment Successful", {
        duration: 3000,
      });
    } else {
      const reasons = [
        "Payment declined by your bank. Please check your card details and try again.",
        "Insufficient funds. Please ensure you have sufficient balance and retry.",
        "Card expired. Please use a different payment method.",
        "Payment timeout. The transaction took too long to process.",
        "Payment gateway error. Please try again or use a different payment method.",
      ];

      const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
      setFailureReason(randomReason);
      setCurrentScreen("failure");

      toast.error("Payment Failed");
    }
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
