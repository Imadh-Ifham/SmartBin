import { CheckCircle2, Download, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { Payment, Invoice } from '../types/payment';

interface PaymentSuccessProps {
  payment: Payment;
  invoice: Invoice;
  onBackToInvoices: () => void;
}

export function PaymentSuccess({ payment, invoice, onBackToInvoices }: PaymentSuccessProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      card: 'Credit/Debit Card',
      bank_transfer: 'Bank Transfer',
      digital_wallet: 'Digital Wallet',
    };
    return labels[method] || method;
  };

  const handleDownloadReceipt = () => {
    // Mock download functionality
    console.log('Downloading receipt for payment:', payment.id);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        {/* Success icon with subtle background */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-700" />
        </div>
        
        <h1 className="text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">
          Your payment has been processed successfully. A confirmation email has been sent to your registered email address.
        </p>
      </div>

      {/* Transaction details card */}
      <Card className="p-8 mb-6 border-gray-200">
        <h3 className="text-gray-900 mb-6 pb-4 border-b border-gray-200">Transaction Details</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Payment ID</span>
            <span className="text-gray-900">{payment.id}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-gray-100">
            <span className="text-gray-600">Invoice Number</span>
            <span className="text-gray-900">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-gray-100">
            <span className="text-gray-600">Invoice Reason</span>
            <span className="text-gray-900">{invoice.reason}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-gray-100">
            <span className="text-gray-600">Payment Method</span>
            <span className="text-gray-900">{getPaymentMethodLabel(payment.method)}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-gray-100">
            <span className="text-gray-600">Date & Time</span>
            <span className="text-gray-900">{formatDateTime(payment.timestamp)}</span>
          </div>

          <div className="flex justify-between items-center py-4 mt-4 pt-4 border-t-2 border-gray-200">
            <span className="text-gray-900">Amount Paid</span>
            <span className="text-green-700" style={{ fontSize: '24px', fontWeight: '600' }}>
              {formatCurrency(payment.amount)}
            </span>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleDownloadReceipt}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Receipt (PDF)
        </Button>
        
        <Button 
          onClick={onBackToInvoices}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>
      </div>

      {/* Additional info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-900" style={{ fontSize: '14px' }}>
          📧 A detailed receipt has been sent to your email. If you have any questions about this transaction, 
          please contact our support team with your Payment ID: <strong>{payment.id}</strong>
        </p>
      </div>
    </div>
  );
}

export default PaymentSuccess;
