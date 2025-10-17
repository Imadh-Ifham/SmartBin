import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { mockInvoices } from '../data/mockInvoices';
import type { Invoice, InvoiceStatus } from '../types/payment';

interface BillingDashboardProps {
  onPayNow: (invoice: Invoice) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export function BillingDashboard({ onPayNow, onViewInvoice }: BillingDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filterInvoices = (status?: InvoiceStatus) => {
    if (!status) return mockInvoices;
    return mockInvoices.filter(inv => inv.status === status);
  };

  const getFilteredInvoices = () => {
    switch (activeTab) {
      case 'pending':
        return filterInvoices('pending').concat(mockInvoices.filter(i => i.status === 'overdue'));
      case 'partially_paid':
        return filterInvoices('partially_paid');
      case 'paid':
        return filterInvoices('paid');
      case 'refunded':
        return filterInvoices('refunded');
      default:
        return mockInvoices;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const invoices = getFilteredInvoices();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-gray-900 mb-2">Billing & Payments</h1>
        <p className="text-gray-600">Manage your invoices, payments, and receipts.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 mb-1" style={{ fontSize: '14px' }}>Total Outstanding</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: '600' }}>
            {formatCurrency(
              mockInvoices
                .filter(i => i.status === 'pending' || i.status === 'overdue')
                .reduce((sum, i) => sum + i.amount + (i.lateFee || 0), 0)
            )}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 mb-1" style={{ fontSize: '14px' }}>Overdue</p>
          <p className="text-red-600" style={{ fontSize: '24px', fontWeight: '600' }}>
            {formatCurrency(
              mockInvoices
                .filter(i => i.status === 'overdue')
                .reduce((sum, i) => sum + i.amount + (i.lateFee || 0), 0)
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 mb-1" style={{ fontSize: '14px' }}>Paid This Month</p>
          <p className="text-green-700" style={{ fontSize: '24px', fontWeight: '600' }}>
            {formatCurrency(
              mockInvoices
                .filter(i => i.status === 'paid')
                .slice(0, 3)
                .reduce((sum, i) => sum + i.amount, 0)
            )}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-600 mb-1" style={{ fontSize: '14px' }}>Total Invoices</p>
          <p className="text-gray-900" style={{ fontSize: '24px', fontWeight: '600' }}>
            {mockInvoices.length}
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="partially_paid">Partially Paid</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="refunded">Refunded</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
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
                      <TableCell className="text-gray-900">{invoice.reason}</TableCell>
                      <TableCell className="text-gray-900">
                        {formatCurrency(invoice.amount + (invoice.lateFee || 0))}
                        {invoice.lateFee && (
                          <span className="text-red-600 ml-1" style={{ fontSize: '12px' }}>
                            (+{formatCurrency(invoice.lateFee)} late fee)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                          <Button 
                            size="sm"
                            onClick={() => onPayNow(invoice)}
                            className="bg-green-700 hover:bg-green-800 text-white"
                          >
                            Pay Now
                          </Button>
                        )}
                        {invoice.status === 'paid' && (
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
