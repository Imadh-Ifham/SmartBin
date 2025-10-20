import { useMemo, useState } from "react";
import {
  CreditCard,
  Building2,
  Wallet,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
// import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import type { Invoice, PaymentMethod } from "../types/payment";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { apiProcessPayment } from "../../../api/payment/pay.api";
import { v4 as uuidv4 } from "uuid";

interface PaymentCheckoutProps {
  invoice: Invoice;
  onConfirmPayment: (method: PaymentMethod) => void;
  onBack: () => void;
}

export function PaymentCheckout({
  invoice,
  onConfirmPayment,
  onBack,
}: PaymentCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const total = useMemo(() => {
    const subtotal = invoice.outstanding ?? invoice.amount;
    const lateFee = invoice.lateFee || 0;
    const discount = invoice.discount || 0;
    return subtotal + lateFee - discount;
  }, [invoice]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleConfirmPayment = async () => {
    try {
      setIsProcessing(true);
      if (paymentMethod !== "card") {
        // For now only Card uses Stripe. Bank/Wallet can be integrated later.
        onConfirmPayment(paymentMethod);
        return;
      }

      if (!stripe || !elements) return;
      const card = elements.getElement(CardElement);
      if (!card) return;

      // 1) Create PaymentIntent on backend
      const idempotencyKey = uuidv4();
      const server = await apiProcessPayment(
        {
          invoiceId: invoice.id,
          method: "Card",
          amount: total,
        },
        idempotencyKey
      );

      if (!server.clientSecret) throw new Error("Missing clientSecret");

      // 2) Confirm card payment on client
      const result = await stripe.confirmCardPayment(server.clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        // Show error to your customer (e.g., insufficient funds)
        throw new Error(result.error.message || "Payment failed");
      }

      // Success. Backend webhook or our immediate success already set invoice to Paid.
      onConfirmPayment("card");
    } catch (e) {
      console.error(e);
      onConfirmPayment("card"); // fall back to existing success/failure screen routing
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = invoice.outstanding ?? invoice.amount;
  const lateFee = invoice.lateFee || 0;
  const discount = invoice.discount || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Invoices
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Payment form */}
        <div className="lg:col-span-2">
          <h1 className="text-gray-900 mb-2">Invoice Payment</h1>
          <p className="text-gray-600 mb-8">Complete your payment securely</p>

          {/* Invoice details */}
          <Card className="p-6 mb-6 border-gray-200">
            <h3 className="text-gray-900 mb-4">Invoice Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number</span>
                <span className="text-gray-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reason</span>
                <span className="text-gray-900">{invoice.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date</span>
                <span className="text-gray-900">
                  {formatDate(invoice.dateIssued)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date</span>
                <span className="text-gray-900">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
            </div>

            {lateFee > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-900" style={{ fontSize: "14px" }}>
                    Late Fee Applied
                  </p>
                  <p className="text-red-700" style={{ fontSize: "13px" }}>
                    A late fee of {formatCurrency(lateFee)} has been added to
                    this invoice.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Payment method selection */}
          <Card className="p-6 border-gray-200">
            <h3 className="text-gray-900 mb-4">Select Payment Method</h3>

            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
            >
              <div className="space-y-3">
                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "card"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  <div className="flex-1">
                    <p className="text-gray-900">Credit / Debit Card</p>
                    <p className="text-gray-500" style={{ fontSize: "13px" }}>
                      Pay securely with your card
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "bank_transfer"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Building2 className="w-5 h-5 text-gray-700" />
                  <div className="flex-1">
                    <p className="text-gray-900">Bank Transfer</p>
                    <p className="text-gray-500" style={{ fontSize: "13px" }}>
                      Direct transfer from your bank
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "digital_wallet"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <RadioGroupItem value="digital_wallet" id="digital_wallet" />
                  <Wallet className="w-5 h-5 text-gray-700" />
                  <div className="flex-1">
                    <p className="text-gray-900">Digital Wallet</p>
                    <p className="text-gray-500" style={{ fontSize: "13px" }}>
                      Apple Pay, Google Pay, PayPal
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>

            {/* Card details form (shown when card is selected) */}
            {paymentMethod === "card" && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <div className="space-y-2">
                  <Label>Card Details</Label>
                  <div className="border rounded p-3">
                    <CardElement options={{ hidePostalCode: true }} />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right column - Payment summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 border-gray-200 sticky top-8">
            <h3 className="text-gray-900 mb-6">Payment Summary</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {lateFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Late Fee</span>
                  <span className="text-red-600">
                    {formatCurrency(lateFee)}
                  </span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">
                    -{formatCurrency(discount)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-900">Total Amount</span>
                <span
                  className="text-gray-900"
                  style={{ fontSize: "24px", fontWeight: "600" }}
                >
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-green-700 hover:bg-green-800 text-white"
              size="lg"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm & Pay"}
            </Button>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600" style={{ fontSize: "12px" }}>
                🔒 Your payment is secured with 256-bit SSL encryption. We do
                not store your card details.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PaymentCheckout;
