import { XCircle, RefreshCw, CreditCard, HelpCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import type { Invoice } from "../types/payment";

interface PaymentFailureProps {
  invoice: Invoice;
  failureReason: string;
  onRetry: () => void;
  onChangePaymentMethod: () => void;
  onContactSupport: () => void;
}

export function PaymentFailure({
  invoice,
  failureReason,
  onRetry,
  onChangePaymentMethod,
  onContactSupport,
}: PaymentFailureProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        {/* Failure icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600">
          We were unable to process your payment. Please review the details
          below and try again.
        </p>
      </div>

      {/* Error details */}
      <Alert className="mb-6 border-red-200 bg-red-50">
        <AlertDescription className="text-red-900">
          <strong>Reason:</strong> {failureReason}
        </AlertDescription>
      </Alert>

      {/* Invoice summary */}
      <Card className="p-6 mb-6 border-gray-200">
        <h3 className="text-gray-900 mb-4">Invoice Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice Number</span>
            <span className="text-gray-900">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Reason</span>
            <span className="text-gray-900">{invoice.reason}</span>
          </div>

          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="text-gray-900">Amount Due</span>
            <span
              className="text-gray-900"
              style={{ fontSize: "20px", fontWeight: "600" }}
            >
              {formatCurrency(invoice.amount + (invoice.lateFee || 0))}
            </span>
          </div>
        </div>
      </Card>

      {/* Common causes */}
      <Card className="p-6 mb-6 border-gray-200 bg-gray-50">
        <h3 className="text-gray-900 mb-3">Common Causes</h3>
        <ul className="space-y-2 text-gray-700" style={{ fontSize: "14px" }}>
          <li className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <span>Insufficient funds in your account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <span>Incorrect card details or expired card</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <span>Card not authorized for online transactions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <span>Bank security restrictions or daily limit exceeded</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <span>Network or connection timeout</span>
          </li>
        </ul>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={onRetry}
          className="w-full bg-green-700 hover:bg-green-800 text-white"
          size="lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Payment
        </Button>

        <Button
          onClick={onChangePaymentMethod}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Change Payment Method
        </Button>

        <Button onClick={onContactSupport} variant="ghost" className="w-full">
          <HelpCircle className="w-4 h-4 mr-2" />
          Contact Support
        </Button>
      </div>

      {/* Support info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-blue-900" style={{ fontSize: "14px" }}>
          Need help? Contact our support team at{" "}
          <strong>support@wastemngt.gov</strong> or call{" "}
          <strong>1-800-WASTE-01</strong>
        </p>
      </div>
    </div>
  );
}

export default PaymentFailure;
