'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  FileText,
  Download,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  Plus,
  Loader2,
} from 'lucide-react';
import { LoadingButton } from "@/components/ui/loading-button";
import Swal from 'sweetalert2';
import { downloadPdfInvoice } from '@/lib/pdf-invoice';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  advancePaid: boolean;
  fullPaid: boolean;
  createdAt: string;
  confirmedAt?: string;
  processingAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  advertiser: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    product: {
      id: string;
      name: string;
      capacity: string;
      bottlesPerPack: number;
      pricePerPack?: string;
    };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentType: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
    paymentProof?: string;
  }>;
  invoiceNumber?: string;
  invoiceUrl?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  dispatchDate?: string;
  trackingNumber?: string;
  courierName?: string;
  deliveryDate?: string;
  deliveredBy?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'BANK_TRANSFER', type: 'ADVANCE', notes: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Swal.fire('Error', 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => { await fetchOrders(); };
    init();
  }, []);

  useEffect(() => {
    const run = async () => {
      let filtered = [...orders];

      if (searchQuery) {
        filtered = filtered.filter(
          (order) =>
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.advertiser.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.advertiser.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (statusFilter !== 'ALL') {
        filtered = filtered.filter((order) => order.status === statusFilter);
      }

      setFilteredOrders(filtered);
    };
    run();
  }, [orders, searchQuery, statusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: `Order status updated to ${newStatus}`,
        timer: 1500,
        showConfirmButton: false,
      });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      Swal.fire('Error', error instanceof Error ? error.message : 'Failed to update status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const verifyPayment = async (paymentId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      setActionLoading(paymentId);
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to verify payment');

      Swal.fire({
        icon: 'success',
        title: 'Payment Updated',
        text: `Payment has been ${status.toLowerCase()}`,
        timer: 1500,
        showConfirmButton: false,
      });
      fetchOrders();
      if (selectedOrder) {
        const updatedOrder = orders.find((o) => o.id === selectedOrder.id);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      Swal.fire('Error', error instanceof Error ? error.message : 'Failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uploadInvoice = async (orderId: string) => {
    const { value: formValues } = await Swal.fire({
      title: 'Upload Invoice',
      html: `
        <input id="invoiceNumber" class="swal2-input" placeholder="Invoice Number">
        <input id="invoiceUrl" class="swal2-input" placeholder="Invoice URL">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return {
          invoiceNumber: (document.getElementById('invoiceNumber') as HTMLInputElement).value,
          invoiceUrl: (document.getElementById('invoiceUrl') as HTMLInputElement).value,
        };
      },
    });

    if (formValues && formValues.invoiceNumber && formValues.invoiceUrl) {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues),
        });

        if (!res.ok) throw new Error('Failed to upload invoice');

        Swal.fire('Success', 'Invoice uploaded successfully', 'success');
        fetchOrders();
      } catch (error) {
        Swal.fire('Error', error instanceof Error ? error.message : 'Failed', 'error');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock },
      CONFIRMED: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', icon: CheckCircle },
      PROCESSING: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: Package },
      SHIPPED: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', icon: Truck },
      DELIVERED: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: CheckCircle },
      CANCELLED: { bg: 'bg-rose-500/10', text: 'text-rose-500', icon: XCircle },
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
      VERIFIED: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
      REJECTED: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
        {status}
      </span>
    );
  };

  const stats = useMemo(() => {
    const base = statusFilter === 'ALL' ? orders : filteredOrders;
    return {
      total: base.length,
      pending: base.filter((o) => o.status === 'PENDING').length,
      confirmed: base.filter((o) => o.status === 'CONFIRMED').length,
      delivered: base.filter((o) => o.status === 'DELIVERED').length,
      totalRevenue: base.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    };
  }, [orders, filteredOrders, statusFilter]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayment = async (orderId: string, paymentData: any) => {
    try {
      setActionLoading(orderId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!res.ok) throw new Error('Failed to update payment');

      Swal.fire({
        icon: 'success',
        title: 'Payment Updated',
        text: 'Payment has been updated successfully',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find((o) => o.id === orderId);
        if (updatedOrder) setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      Swal.fire('Error', error instanceof Error ? error.message : 'Failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (order: Order) => {
    try {
      setActionLoading(`pdf-${order.id}`);
      const invoiceNumber = order.invoiceNumber || `INV-${order.orderNumber}`;

      const data = {
        orderNumber: order.orderNumber,
        invoiceNumber,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        advanceAmount: Number(order.advanceAmount),
        balanceAmount: Number(order.balanceAmount),
        advancePaid: order.advancePaid,
        fullPaid: order.fullPaid,
        paidAmount: order.payments
          .filter((p) => p.status === 'VERIFIED')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPincode: order.shippingPincode,
        advertiser: {
          name: order.advertiser.name,
          companyName: order.advertiser.companyName,
          email: order.advertiser.email,
          phone: order.advertiser.phone || undefined,
        },
        items: order.items.map((item) => ({
          product: { name: item.product.name, capacity: item.product.capacity },
          quantity: item.quantity,
          pricePerUnit: Number(item.pricePerUnit),
          totalPrice: Number(item.totalPrice),
        })),
      };

      await downloadPdfInvoice(data, '/favicon.png');
    } catch (error) {
      Swal.fire('Error', error instanceof Error ? error.message : 'Failed to download', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPaymentReceipt = async (order: Order, payment: { id: string; amount: number | string; paymentType: string; paymentMethod: string; status: string; createdAt: string; transactionId?: string; notes?: string }) => {
    const num = (v: number | string | undefined | null): number => {
      if (v == null) return 0;
      if (typeof v === "number") return v;
      const p = parseFloat(v);
      return isNaN(p) ? 0 : p;
    };
    function fmt(v: number | string | undefined | null): string {
      const n = num(v);
      return "INR " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    try {
      setActionLoading(`receipt-${payment.id}`);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const m = 18;
      const uw = pw - m * 2;

      doc.setFillColor(6, 182, 212);
      doc.rect(0, 0, pw, 6, 'F');

      let y = 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(10, 20, 36);
      doc.text('BLUNIRA', m, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('QR Hydration Marketing  |  support@blunira.com  |  +91 98765 43210', m, y + 12);

      y += 18;
      doc.setDrawColor(6, 182, 212);
      doc.setLineWidth(1.2);
      doc.line(m, y, pw - m, y);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(10, 20, 36);
      doc.text('PAYMENT RECEIPT', m, y);

      const rx = pw - m;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const receiptId = (order.invoiceNumber || order.orderNumber) + '-' + payment.id.slice(0, 8);
      doc.text(receiptId, rx, y - 4, { align: 'right' });
      doc.setFontSize(7);
      doc.text('Order ' + order.orderNumber, rx, y + 3, { align: 'right' });
      doc.text(new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), rx, y + 9, { align: 'right' });

      y += 20;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(m, y, pw - m, y);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('FROM', m, y);
      doc.text('TO', m + 90, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(10, 20, 36);
      doc.text('Blunira', m, y + 8);
      doc.text(order.advertiser.companyName, m + 90, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('support@blunira.com', m, y + 15);
      if (order.advertiser.phone) doc.text(order.advertiser.phone, m, y + 21);
      doc.text(order.advertiser.email, m + 90, y + 15);
      doc.text(order.shippingCity + ', ' + order.shippingState + ' - ' + order.shippingPincode, m + 90, y + 21);

      y += 32;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(m, y, pw - m, y);

      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('ORDER REFERENCE', m, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(10, 20, 36);
      doc.text('Order #: ' + order.orderNumber, m, y);
      doc.text('Invoice #: ' + (order.invoiceNumber || 'N/A'), m + 60, y);
      doc.text('Type: ' + payment.paymentType, rx, y, { align: 'right' });

      y += 14;
      const boxH = 44;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(m, y, uw, boxH, 4, 4, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.roundedRect(m, y, uw, boxH, 4, 4, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(10, 20, 36);
      doc.text('AMOUNT PAID', m + 12, y + 14);

      doc.setFontSize(24);
      doc.setTextColor(6, 182, 212);
      doc.text(fmt(payment.amount), rx - 12, y + 14, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Method: ' + payment.paymentMethod, m + 12, y + 25);
      doc.text('Status: ' + payment.status, m + 12, y + 32);
      if (payment.transactionId) doc.text('TXN ID: ' + payment.transactionId, rx - 12, y + 25, { align: 'right' });
      if (payment.notes) doc.text('Note: ' + payment.notes, rx - 12, y + 32, { align: 'right' });

      y += boxH + 10;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(m, y, pw - m, y);

      y += 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDER ITEMS', m, y);

      const tableHead = [['#', 'ITEM', 'QTY', 'UNIT PRICE', 'AMOUNT']];
      const tableBody = order.items.map((it, i) => [
        String(i + 1),
        it.product.name + ' (' + it.product.capacity + ')',
        it.quantity.toLocaleString('en-IN'),
        Number(it.pricePerUnit).toFixed(2),
        Number(it.totalPrice).toFixed(2),
      ]);

      const autoTableMod = (await import('jspdf-autotable')).default;
      autoTableMod(doc, {
        head: tableHead,
        body: tableBody,
        startY: y + 5,
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 3, halign: 'center' },
        bodyStyles: { fontSize: 8, textColor: [10, 20, 36], cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 68, halign: 'left' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 34, halign: 'right' },
          4: { cellWidth: 34, halign: 'right' },
        },
        margin: { left: m, right: m },
      });

      const fy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      const sbw = 82;
      const sbx = pw - m - sbw;
      const sbh = 40;
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(sbx, fy, sbw, sbh, 4, 4, 'F');
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.4);
      doc.roundedRect(sbx, fy, sbw, sbh, 4, 4, 'S');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 100, 130);
      doc.text('TOTAL AMOUNT', sbx + 8, fy + 9);
      doc.text('AMOUNT PAID', sbx + 8, fy + 17);
      doc.text('BALANCE DUE', sbx + 8, fy + 25);

      const verifiedPaid = order.payments.filter((p) => p.status === 'VERIFIED').reduce((s, p) => s + Number(p.amount), 0);
      const total = num(order.totalAmount);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(10, 20, 36);
      doc.text(fmt(total), sbx + sbw - 8, fy + 9, { align: 'right' });
      doc.text(fmt(verifiedPaid), sbx + sbw - 8, fy + 17, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 182, 212);
      doc.text(fmt(Math.max(0, total - verifiedPaid)), sbx + sbw - 8, fy + 25, { align: 'right' });

      doc.setFillColor(245, 247, 250);
      doc.rect(0, ph - 22, pw, 22, 'F');
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.3);
      doc.line(0, ph - 22, pw, ph - 22);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(6, 182, 212);
      doc.text('BLUNIRA', m, ph - 11);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('Thank you for your business!', pw / 2, ph - 13, { align: 'center' });
      doc.text('This is a computer-generated receipt. For queries: support@blunira.com', pw / 2, ph - 8, { align: 'center' });

      doc.save('Receipt_' + order.orderNumber + '_' + payment.paymentType + '_' + payment.id.slice(0, 8) + '.pdf');
    } catch (error) {
      Swal.fire('Error', error instanceof Error ? error.message : 'Failed to generate receipt', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2">Order Management</h1>
          <p className="text-[var(--text-secondary)]">Manage water bottle orders and payments</p>
        </div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {[
            { label: 'Total Orders', value: stats.total, color: 'text-[var(--text-primary)]', icon: Package },
            { label: 'Pending', value: stats.pending, color: 'text-amber-500', icon: Clock },
            { label: 'Confirmed', value: stats.confirmed, color: 'text-cyan-500', icon: CheckCircle },
            { label: 'Delivered', value: stats.delivered, color: 'text-emerald-500', icon: Truck },
            { label: 'Revenue', value: `₹${Number(stats.totalRevenue).toFixed(0)}`, color: 'text-[var(--text-primary)]', icon: FileText },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--card-border)] rounded-2xl p-4 md:p-5 transition-all duration-300 overflow-hidden cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className={`text-2xl md:text-3xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order number, company, or email..."
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-16 text-center"
            >
              <Package className="w-20 h-20 text-[var(--text-muted)] mx-auto mb-4 opacity-30" />
              <p className="text-xl font-bold text-[var(--text-primary)] mb-2">No orders found</p>
              <p className="text-sm text-[var(--text-muted)]">No orders match your current filters</p>
            </motion.div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ y: -2, scale: 1.005 }}
                className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-cyan-500/20 rounded-2xl p-5 md:p-6 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/3 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] truncate">
                        {order.orderNumber}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] truncate">
                      {order.advertiser.companyName} • {order.advertiser.email}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownloadPdf(order)}
                      disabled={actionLoading === `pdf-${order.id}`}
                      className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download Invoice PDF"
                    >
                      {actionLoading === `pdf-${order.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowModal(true);
                      }}
                      className="p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--card-border)] transition-all cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
                  <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--card-border)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total</p>
                    <p className="text-base font-bold text-[var(--text-primary)]">₹{Number(order.totalAmount).toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--card-border)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Advance</p>
                    <p className={`text-sm font-bold ${order.advancePaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {order.advancePaid ? '✓ Paid' : '⏳ Pending'}
                    </p>
                  </div>
                  <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--card-border)]">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Balance</p>
                    <p className={`text-sm font-bold ${order.fullPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {order.fullPaid ? '✓ Paid' : '⏳ Pending'}
                    </p>
                  </div>
                </div>

                {/* Pending Payments */}
                {order.payments.some((p) => p.status === 'PENDING') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4"
                  >
                    <p className="text-xs font-bold text-amber-500 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pending Payment Verification
                    </p>
                    {order.payments
                      .filter((p) => p.status === 'PENDING')
                      .map((payment) => (
                        <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div>
                            <p className="text-sm text-[var(--text-primary)] font-medium">
                              {payment.paymentType} - ₹{Number(payment.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {payment.paymentMethod} • {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {payment.paymentProof && (
                              <a
                                href={payment.paymentProof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20"
                              >
                                View Proof
                              </a>
                            )}
                            <LoadingButton
                              onClick={() => verifyPayment(payment.id, 'VERIFIED')}
                              loading={actionLoading === payment.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                            >
                              Verify
                            </LoadingButton>
                            <LoadingButton
                              onClick={() => verifyPayment(payment.id, 'REJECTED')}
                              loading={actionLoading === payment.id}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
                            >
                              Reject
                            </LoadingButton>
                          </div>
                        </div>
                      ))}
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Order Detail Modal - Outside container to prevent sidebar offset */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--bg-base)] border border-[var(--card-border)] rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/3 to-purple-500/5 pointer-events-none" />

            {/* Premium Header */}
            <div className="sticky top-0 z-20 bg-[var(--bg-base)]/95 backdrop-blur-xl border-b border-[var(--card-border)] p-4 md:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-tight">Order Details</h2>
                  <p className="text-xs md:text-sm text-[var(--text-muted)] font-mono">{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 md:p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <XCircle className="w-4 h-4 md:w-5 md:h-5 text-[var(--text-muted)] group-hover:text-cyan-500 transition-colors" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-5 relative">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                {/* Customer & Shipping */}
                <div className="space-y-4 md:space-y-5">
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <User className="w-4 h-4 text-purple-500" />
                      </div>
                      <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Customer Information</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Company</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{selectedOrder.advertiser.companyName}</p>
                      </div>
                      <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Contact</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{selectedOrder.advertiser.name}</p>
                      </div>
                      <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Email</p>
                        <p className="text-sm font-bold text-cyan-500 truncate">{selectedOrder.advertiser.email}</p>
                      </div>
                      <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Phone</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{selectedOrder.advertiser.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <MapPin className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Shipping Address</p>
                    </div>
                    <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {selectedOrder.shippingAddress}<br />
                        {selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingPincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Summary & Items */}
                <div className="space-y-4 md:space-y-5">
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <Package className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Order Items</p>
                    </div>
                    <div className="space-y-2.5">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)] hover:border-cyan-500/20 transition-all">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[var(--text-primary)]">{item.product.name}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.product.capacity} • {item.quantity.toLocaleString()} units</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-cyan-500">₹{Number(item.totalPrice).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <CreditCard className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Payment Summary</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-[var(--bg-elevated)] rounded-xl">
                        <span className="text-sm text-[var(--text-secondary)]">Total Amount</span>
                        <span className="text-base font-black text-[var(--text-primary)]">₹{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[var(--bg-elevated)] rounded-xl">
                        <span className="text-sm text-[var(--text-secondary)]">Advance (50%)</span>
                        <span className={`text-sm font-bold ${selectedOrder.advancePaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                          ₹{Number(selectedOrder.advanceAmount).toFixed(2)}
                          {selectedOrder.advancePaid ? ' ✓ Paid' : ' ⏳ Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-[var(--bg-elevated)] rounded-xl">
                        <span className="text-sm text-[var(--text-secondary)]">Balance (50%)</span>
                        <span className={`text-sm font-bold ${selectedOrder.fullPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                          ₹{Number(selectedOrder.balanceAmount).toFixed(2)}
                          {selectedOrder.fullPaid ? ' ✓ Paid' : ' ⏳ Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {selectedOrder.payments.length > 0 && (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <Clock className="w-4 h-4 text-indigo-500" />
                    </div>
                    <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Payment History</p>
                  </div>
                  <div className="space-y-2.5">
                    {selectedOrder.payments.map((payment) => (
                      <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${payment.status === 'VERIFIED' ? 'bg-emerald-500' : payment.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                              {payment.paymentType} - ₹{Number(payment.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {payment.paymentMethod} • {new Date(payment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadge(payment.status)}
                          {payment.status === 'VERIFIED' && (
                            <button
                              onClick={() => handleDownloadPaymentReceipt(selectedOrder, payment)}
                              disabled={actionLoading === `receipt-${payment.id}`}
                              className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-all border border-cyan-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              title="Download Receipt"
                            >
                              {actionLoading === `receipt-${payment.id}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          {payment.status === 'PENDING' && (
                            <div className="flex gap-2">
                              {payment.paymentProof && (
                                <a
                                  href={payment.paymentProof}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20 cursor-pointer"
                                >
                                  View Proof
                                </a>
                              )}
                              <LoadingButton
                                onClick={() => verifyPayment(payment.id, 'VERIFIED')}
                                loading={actionLoading === payment.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                              >
                                Verify
                              </LoadingButton>
                              <LoadingButton
                                onClick={() => verifyPayment(payment.id, 'REJECTED')}
                                loading={actionLoading === payment.id}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
                              >
                                Reject
                              </LoadingButton>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice Section */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                    <FileText className="w-4 h-4 text-cyan-500" />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Invoice</p>
                </div>
                <div className="flex flex-col gap-3">
                  {(selectedOrder.invoiceNumber || selectedOrder.invoiceUrl) && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-emerald-500">Invoice #{selectedOrder.invoiceNumber}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {selectedOrder.invoiceUrl ? "Available for download" : "Auto-generated on status update"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadPdf(selectedOrder)}
                          disabled={actionLoading === `pdf-${selectedOrder.id}`}
                          className="px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-xs hover:bg-rose-600 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === `pdf-${selectedOrder.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          PDF
                        </button>
                        <button
                          onClick={() => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : '';
                            const url = `${origin}/api/orders/${selectedOrder.id}/invoice`;
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `Invoice_${selectedOrder.invoiceNumber || selectedOrder.orderNumber}.doc`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Word
                        </button>
                      </div>
                    </div>
                  )}
                  {!selectedOrder.invoiceNumber && !selectedOrder.invoiceUrl && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleDownloadPdf(selectedOrder)}
                        disabled={actionLoading === `pdf-${selectedOrder.id}`}
                        className="flex-1 px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-xl font-bold hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === `pdf-${selectedOrder.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Auto Generate & Download Invoice (PDF)
                      </button>
                      <button
                        onClick={() => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          const url = `${origin}/api/orders/${selectedOrder.id}/invoice`;
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `Invoice_${selectedOrder.orderNumber}.doc`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Word
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Payment Management */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Payment Management</p>
                </div>

                {(() => {
                  const verifiedPayments = selectedOrder.payments.filter((p) => p.status === 'VERIFIED');
                  const totalVerified = verifiedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                  const advanceVerified = verifiedPayments
                    .filter((p) => p.paymentType === 'ADVANCE')
                    .reduce((sum, p) => sum + Number(p.amount), 0);
                  const balanceVerified = verifiedPayments
                    .filter((p) => p.paymentType === 'BALANCE')
                    .reduce((sum, p) => sum + Number(p.amount), 0);
                  const remainingAdvance = Math.max(0, Number(selectedOrder.advanceAmount) - advanceVerified);
                  const remainingBalance = Math.max(0, Number(selectedOrder.balanceAmount) - balanceVerified);

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Paid</p>
                          <p className="text-lg font-black text-[var(--text-primary)]">₹{totalVerified.toFixed(2)}</p>
                          <p className="text-xs text-[var(--text-muted)]">of ₹{Number(selectedOrder.totalAmount).toFixed(2)} total</p>
                        </div>
                        <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Advance Paid</p>
                          <p className="text-lg font-black text-emerald-500">₹{advanceVerified.toFixed(2)}</p>
                          <p className="text-xs text-[var(--text-muted)]">Required: ₹{Number(selectedOrder.advanceAmount).toFixed(2)}</p>
                          {remainingAdvance > 0 && (
                            <p className="text-xs text-amber-500 font-bold mt-1">Remaining: ₹{remainingAdvance.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Balance Paid</p>
                          <p className="text-lg font-black text-emerald-500">₹{balanceVerified.toFixed(2)}</p>
                          <p className="text-xs text-[var(--text-muted)]">Required: ₹{Number(selectedOrder.balanceAmount).toFixed(2)}</p>
                          {remainingBalance > 0 && (
                            <p className="text-xs text-amber-500 font-bold mt-1">Remaining: ₹{remainingBalance.toFixed(2)}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <LoadingButton
                          onClick={() => updatePayment(selectedOrder.id, {
                            advancePaid: true,
                            fullPaid: selectedOrder.advancePaid ? selectedOrder.fullPaid : false,
                            paidAmount: Number(selectedOrder.advanceAmount),
                            paymentMethod: paymentForm.method,
                            paymentNotes: 'Advance marked as paid by admin',
                          })}
                          loading={actionLoading === selectedOrder.id}
                          disabled={selectedOrder.advancePaid}
                          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {selectedOrder.advancePaid ? 'Advance Already Paid' : 'Mark Advance as Paid'}
                        </LoadingButton>
                        <LoadingButton
                          onClick={() => {
                            const remaining = remainingBalance;
                            updatePayment(selectedOrder.id, {
                              fullPaid: true,
                              advancePaid: true,
                              paidAmount: remaining > 0 ? remaining : Number(selectedOrder.balanceAmount),
                              paymentMethod: paymentForm.method,
                              paymentNotes: 'Balance marked as paid by admin',
                            });
                          }}
                          loading={actionLoading === selectedOrder.id}
                          disabled={selectedOrder.advancePaid && selectedOrder.fullPaid}
                          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] shadow-lg shadow-cyan-500/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {selectedOrder.fullPaid ? 'Fully Paid' : remainingBalance > 0 ? `Mark Balance as Paid (₹${remainingBalance.toFixed(2)})` : 'Mark as Fully Paid'}
                        </LoadingButton>
                      </div>

                      <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Record Custom Payment</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-[var(--text-muted)] mb-1">Amount (INR)</label>
                            <input
                              type="number"
                              value={paymentForm.amount}
                              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                              className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--text-primary)] text-sm focus:border-cyan-500 focus:outline-none cursor-pointer"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--text-muted)] mb-1">Apply To</label>
                            <select
                              value={paymentForm.type}
                              onChange={(e) => {
                                const type = e.target.value;
                                setPaymentForm({ ...paymentForm, type });
                              }}
                              className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--text-primary)] text-sm focus:border-cyan-500 focus:outline-none cursor-pointer"
                            >
                              <option value="ADVANCE">Advance (remaining: ₹{remainingAdvance.toFixed(2)})</option>
                              <option value="BALANCE">Balance (remaining: ₹{remainingBalance.toFixed(2)})</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--text-muted)] mb-1">Method</label>
                            <select
                              value={paymentForm.method}
                              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                              className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--text-primary)] text-sm focus:border-cyan-500 focus:outline-none cursor-pointer"
                            >
                              <option value="BANK_TRANSFER">Bank Transfer</option>
                              <option value="UPI">UPI</option>
                              <option value="CARD">Card</option>
                              <option value="CASH">Cash</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-[var(--text-muted)] mb-1">Notes</label>
                            <input
                              type="text"
                              value={paymentForm.notes}
                              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                              className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--text-primary)] text-sm focus:border-cyan-500 focus:outline-none cursor-pointer"
                              placeholder="Optional notes"
                            />
                          </div>
                        </div>
                        <LoadingButton
                          onClick={() => {
                            const amount = Number(paymentForm.amount);
                            if (!amount || amount <= 0) {
                              Swal.fire('Error', 'Please enter a valid amount', 'error');
                              return;
                            }

                            if (paymentForm.type === 'ADVANCE' && amount > remainingAdvance) {
                              Swal.fire('Error', `Advance remaining is only ₹${remainingAdvance.toFixed(2)}`, 'error');
                              return;
                            }
                            if (paymentForm.type === 'BALANCE' && amount > remainingBalance) {
                              Swal.fire('Error', `Balance remaining is only ₹${remainingBalance.toFixed(2)}`, 'error');
                              return;
                            }

                            const newAdvancePaid = paymentForm.type === 'ADVANCE'
                              ? advanceVerified + amount >= Number(selectedOrder.advanceAmount)
                              : selectedOrder.advancePaid;
                            const newFullPaid = paymentForm.type === 'BALANCE'
                              ? balanceVerified + amount >= Number(selectedOrder.balanceAmount)
                              : selectedOrder.fullPaid;

                            updatePayment(selectedOrder.id, {
                              paidAmount: amount,
                              paymentMethod: paymentForm.method,
                              paymentNotes: paymentForm.notes,
                              advancePaid: newAdvancePaid,
                              fullPaid: newFullPaid,
                            });
                            setPaymentForm({ amount: '', method: 'BANK_TRANSFER', type: 'ADVANCE', notes: '' });
                          }}
                          loading={actionLoading === selectedOrder.id}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:scale-[1.02]"
                        >
                          <Plus className="w-4 h-4" />
                          Record Payment
                        </LoadingButton>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Status Change */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                    <Package className="w-4 h-4 text-cyan-500" />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Change Order Status</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((status) => {
                    const isActive = selectedOrder.status === status;
                    return (
                      <LoadingButton
                        key={status}
                        onClick={() => {
                          if (!isActive) {
                            Swal.fire({
                              title: `Change to ${status}?`,
                              text: `Order status will be updated to ${status}.`,
                              icon: 'question',
                              showCancelButton: true,
                              confirmButtonColor: '#06b6d4',
                              confirmButtonText: 'Yes, Update',
                            }).then((result) => {
                              if (result.isConfirmed) {
                                updateOrderStatus(selectedOrder.id, status);
                                setSelectedOrder({ ...selectedOrder, status });
                              }
                            });
                          }
                        }}
                        loading={actionLoading === selectedOrder.id}
                        disabled={isActive || actionLoading === selectedOrder.id}
                        className={`px-4 py-2.5 border ${isActive
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                          : 'border-[var(--card-border)] text-[var(--text-muted)] hover:border-cyan-500/30 hover:text-[var(--text-primary)]'
                          }`}
                      >
                        {isActive && <CheckCircle className="w-3 h-3" />}
                        {status}
                      </LoadingButton>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-2">Click a status to update. Current: <span className="font-bold text-cyan-500">{selectedOrder.status}</span></p>
              </div>

              {/* Status Timeline */}
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Status Timeline</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Created', date: selectedOrder.createdAt, color: 'bg-gray-400' },
                    ...(selectedOrder.confirmedAt ? [{ label: 'Confirmed', date: selectedOrder.confirmedAt, color: 'bg-cyan-500' }] : []),
                    ...(selectedOrder.processingAt ? [{ label: 'Processing', date: selectedOrder.processingAt, color: 'bg-blue-500' }] : []),
                    ...(selectedOrder.shippedAt ? [{ label: 'Shipped', date: selectedOrder.shippedAt, color: 'bg-indigo-500' }] : []),
                    ...(selectedOrder.deliveredAt ? [{ label: 'Delivered', date: selectedOrder.deliveredAt, color: 'bg-emerald-500' }] : []),
                    ...(selectedOrder.cancelledAt ? [{ label: 'Cancelled', date: selectedOrder.cancelledAt, color: 'bg-rose-500' }] : []),
                  ].map((event, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] rounded-xl border border-[var(--card-border)]">
                      <div className={`w-2 h-2 rounded-full ${event.color}`} />
                      <span className="text-xs font-bold text-[var(--text-primary)]">{event.label}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {event.date ? new Date(event.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


