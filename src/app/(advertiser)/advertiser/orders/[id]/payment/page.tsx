'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Swal from 'sweetalert2';
import {
  Package,
  Upload,
  CreditCard,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  MapPin,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { LoadingButton } from "@/components/ui/loading-button";

interface OrderItem {
  id: string;
  quantity: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    capacity: string;
    pricePerPack?: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  paymentProof?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  advancePaid: boolean;
  fullPaid: boolean;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  advertiser: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  payments: Payment[];
}

export default function AdvertiserOrderPaymentPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentType, setPaymentType] = useState<'ADVANCE' | 'BALANCE'>('ADVANCE');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch order');
      setOrder(data.order);
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (!paymentProofFile) {
      Swal.fire('Error', 'Please upload payment proof', 'error');
      return;
    }

    const amount =
      paymentType === 'ADVANCE' ? Number(order.advanceAmount) : Number(order.balanceAmount);

    setSubmitting(true);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('orderId', order.id);
      formData.append('amount', amount.toFixed(2));
      formData.append('paymentType', paymentType);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId);
      formData.append('notes', notes);
      formData.append('paymentProof', paymentProofFile);

      const res = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Payment Submitted!',
        html: `
          <p>Your payment proof has been submitted for verification.</p>
          <p class="text-sm mt-2 text-gray-400">The admin will verify your payment shortly.</p>
        `,
        confirmButtonText: 'Back to Orders',
      });

      window.location.href = '/advertiser/orders';
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
      CONFIRMED: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
      PROCESSING: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
      SHIPPED: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
      DELIVERED: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
      CANCELLED: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading payment page...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Order not found</p>
        </div>
      </div>
    );
  }

  const remainingAmount = Number(order.balanceAmount) - (order.fullPaid ? 0 : 0);
  const canPayAdvance = !order.advancePaid && order.status === 'PENDING';
  const canPayBalance = order.advancePaid && !order.fullPaid;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => (window.location.href = '/advertiser/orders')}
            className="flex items-center gap-2 text-cyan-500 hover:text-cyan-400 text-sm font-bold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
          <h1 className="text-3xl font-black text-[var(--text-primary)] mb-1">Make Payment</h1>
          <p className="text-[var(--text-secondary)]">Order #{order.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-500" />
              Order Summary
            </h2>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-muted)]">Order Status</span>
              {getStatusBadge(order.status)}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Total Amount</span>
                <span className="font-bold text-[var(--text-primary)]">₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Advance (50%)</span>
                <span className={`font-bold ${order.advancePaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                  ₹{Number(order.advanceAmount).toFixed(2)} {order.advancePaid ? '✓ Paid' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Balance (50%)</span>
                <span className={`font-bold ${order.fullPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                  ₹{Number(order.balanceAmount).toFixed(2)} {order.fullPaid ? '✓ Paid' : 'Pending'}
                </span>
              </div>
            </div>

            <div className="border-t border-[var(--card-border)] pt-4">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-3">Items</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm p-2 bg-[var(--bg-elevated)] rounded-lg">
                    <span className="text-[var(--text-secondary)]">
                      {item.product.name} ({item.product.capacity}) × {item.quantity.toLocaleString()} units
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">₹{Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--card-border)] pt-4">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] mb-2">Shipping Address</h3>
              <p className="text-sm text-[var(--text-primary)]">
                {order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
              </p>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-cyan-500" />
              Submit Payment
            </h2>

            {!canPayAdvance && !canPayBalance ? (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <p className="text-sm text-cyan-500 font-bold text-center">
                  {order.advancePaid && order.fullPaid
                    ? 'Order is fully paid.'
                    : 'No payment is currently due for this order.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    Payment Type *
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as 'ADVANCE' | 'BALANCE')}
                    className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                  >
                    {canPayAdvance && (
                      <option value="ADVANCE">Advance Payment (₹{Number(order.advanceAmount).toFixed(2)})</option>
                    )}
                    {canPayBalance && (
                      <option value="BALANCE">Balance Payment (₹{Number(order.balanceAmount).toFixed(2)})</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. TXN123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    Payment Proof (Screenshot/Receipt) *
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPaymentProofFile(file);
                      }
                    }}
                    className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-500 hover:file:bg-cyan-500/20"
                  />
                  {paymentProofFile && (
                    <p className="text-xs text-emerald-500 mt-1 font-bold">Selected: {paymentProofFile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none resize-none"
                    placeholder="Any payment details..."
                  />
                </div>

                <LoadingButton
                  type="submit"
                  loading={submitting || uploading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02]"
                >
                  {submitting ? 'Submitting...' : `Pay ₹${paymentType === 'ADVANCE' ? Number(order.advanceAmount).toFixed(2) : Number(order.balanceAmount).toFixed(2)}`}
                </LoadingButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
