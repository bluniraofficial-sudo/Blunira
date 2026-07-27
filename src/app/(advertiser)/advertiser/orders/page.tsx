'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Package, 
  Plus, 
  Minus,
  MapPin,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  Box,
  Download,
  Loader2,
  X,
  Truck,
  Eye,
  Receipt,
} from 'lucide-react';
import Swal from 'sweetalert2';

import { downloadPdfInvoice } from '@/lib/pdf-invoice';

interface Product {
  id: string;
  name: string;
  description: string;
  capacity: string;
  moq: number;
  bottlesPerPack: number;
  pricePerPack?: number;
  imageUrl?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  totalPrice: number;
  pricePerUnit: number;
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
  transactionId?: string;
  notes?: string;
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
  createdAt: string;
  advertiser?: {
    name: string;
    companyName: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  payments: Payment[];
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
  deliveryInstructions?: string;
  handleMissingItems?: string;
  specialHandling?: string;
  notes?: string;
}

const MISSING_ITEM_OPTIONS = [
  { value: 'REPLACE', label: 'Replace Items', desc: 'We will ship replacement items' },
  { value: 'REFUND', label: 'Refund Amount', desc: 'Refund for missing/broken items' },
  { value: 'CREDIT_NOTE', label: 'Credit Note', desc: 'Store credit for future orders' },
];

export default function AdvertiserOrdersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'browse' | 'cart' | 'orders'>('browse');

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [handleMissingItems, setHandleMissingItems] = useState('REPLACE');
  const [specialHandling, setSpecialHandling] = useState('');

  // Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchProducts(), fetchOrders()]);
    };
    init();
  }, []);

  const addToCart = (product: Product) => {
    const packQty = product.moq;
    const unitQty = packQty * product.bottlesPerPack;
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + unitQty);
    } else {
      setCart([...cart, { product, quantity: unitQty }]);
    }
    Swal.fire({
      icon: 'success',
      title: 'Added to Cart',
      text: `${product.name} - ${packQty} pack${packQty === 1 ? '' : 's'} added`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const minPacks = item.product.moq;
    const minUnits = minPacks * item.product.bottlesPerPack;

    if (newQuantity < minUnits) {
      Swal.fire({
        icon: 'warning',
        title: 'Minimum Order Quantity',
        text: `Minimum order is ${minPacks} pack${minPacks === 1 ? '' : 's'} (${minUnits} bottles)`,
      });
      return;
    }

    setCart(cart.map((i) => 
      i.product.id === productId ? { ...i, quantity: newQuantity } : i
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const pricePerPack = Number(item.product.pricePerPack || 0);
      const packs = Math.floor(item.quantity / item.product.bottlesPerPack);
      const remaining = item.quantity % item.product.bottlesPerPack;
      const remainingPrice = remaining > 0 ? (pricePerPack / item.product.bottlesPerPack) * remaining : 0;
      return sum + (packs * pricePerPack) + remainingPrice;
    }, 0);
  };

  const getPackInfo = (quantity: number, bottlesPerPack: number) => {
    const packs = Math.floor(quantity / bottlesPerPack);
    const remaining = quantity % bottlesPerPack;
    return { packs, remaining, total: quantity };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Swal.fire('Error', 'Cart is empty', 'error');
      return;
    }

    if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
      Swal.fire('Error', 'Please fill in all shipping address fields', 'error');
      return;
    }

    try {
      setActionLoading('checkout');
      const orderData = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        gstNumber,
        notes,
        deliveryInstructions,
        handleMissingItems,
        specialHandling,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      Swal.fire({
        icon: 'success',
        title: 'Order Placed!',
        html: `
          <p>Your order <strong>${data.order.orderNumber}</strong> has been placed successfully.</p>
          <p class="text-lg mt-3">Total: ₹${Number(data.order.totalAmount).toFixed(2)}</p>
          <p class="text-cyan-500 font-bold">Advance (50%): ₹${Number(data.order.advanceAmount).toFixed(2)}</p>
          <p class="text-sm mt-3 text-[var(--text-muted)]">Payment status will be updated by the admin shortly.</p>
        `,
        confirmButtonText: 'View Orders',
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        customClass: { popup: 'border border-cyan-500/20 rounded-3xl' },
      }).then((result) => {
        if (result.isConfirmed) {
          setView('orders');
          fetchOrders();
        }
      });

      setCart([]);
      setShippingAddress('');
      setShippingCity('');
      setShippingState('');
      setShippingPincode('');
      setGstNumber('');
      setNotes('');
      setDeliveryInstructions('');
      setHandleMissingItems('REPLACE');
      setSpecialHandling('');
    } catch (error) {
      Swal.fire('Error', error instanceof Error ? error.message : 'An error occurred', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badges: Record<string, { bg: string; text: string; border: string; icon: any }> = {
      PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', icon: Clock },
      CONFIRMED: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20', icon: CheckCircle },
      PROCESSING: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', icon: Package },
      SHIPPED: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20', icon: Package },
      DELIVERED: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', icon: CheckCircle },
      CANCELLED: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20', icon: AlertCircle },
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
        <Icon className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  const openOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      const data = await res.json();
      const orderData = data.order;
      const paidAmount = orderData.payments
        ?.filter((p: Payment) => p.status === 'VERIFIED')
        .reduce((sum: number, p: Payment) => sum + Number(p.amount), 0) || 0;
      downloadPdfInvoice({
        orderNumber: orderData.orderNumber,
        invoiceNumber: orderData.invoiceNumber || `INV-${orderData.orderNumber}`,
        status: orderData.status,
        totalAmount: Number(orderData.totalAmount),
        advanceAmount: Number(orderData.advanceAmount),
        balanceAmount: Number(orderData.balanceAmount),
        advancePaid: orderData.advancePaid,
        fullPaid: orderData.fullPaid,
        paidAmount,
        createdAt: orderData.createdAt,
        shippingAddress: orderData.shippingAddress,
        shippingCity: orderData.shippingCity,
        shippingState: orderData.shippingState,
        shippingPincode: orderData.shippingPincode,
        gstNumber: orderData.gstNumber,
        advertiser: {
          name: orderData.advertiser?.name || '',
          companyName: orderData.advertiser?.companyName || 'Blunira',
          email: orderData.advertiser?.email || 'support@blunira.com',
          phone: orderData.advertiser?.phone,
        },
        items: orderData.items.map((item: OrderItem) => ({
          product: { name: item.product.name, capacity: item.product.capacity },
          quantity: item.quantity,
          pricePerUnit: Number(item.pricePerUnit),
          totalPrice: Number(item.totalPrice),
        })),
      });
    } catch {
      Swal.fire('Error', 'Failed to download invoice', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 md:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8 pt-4 md:pt-0">
          <h1 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-1 md:mb-2">Water Bottle Orders</h1>
          <p className="text-sm md:text-base text-[var(--text-secondary)]">Order Blunira premium water bottles with QR-enabled labels</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--card-border)]">
          <button
            onClick={() => setView('browse')}
            className={`px-4 md:px-6 py-3 font-bold text-sm transition-all cursor-pointer ${
              view === 'browse'
                ? 'text-cyan-500 border-b-2 border-cyan-500'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ShoppingCart className="w-4 h-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">Browse</span>
          </button>
          <button
            onClick={() => setView('cart')}
            className={`px-4 md:px-6 py-3 font-bold text-sm transition-all relative cursor-pointer ${
              view === 'cart'
                ? 'text-cyan-500 border-b-2 border-cyan-500'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Package className="w-4 h-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 text-white text-xs rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('orders')}
            className={`px-4 md:px-6 py-3 font-bold text-sm transition-all cursor-pointer ${
              view === 'orders'
                ? 'text-cyan-500 border-b-2 border-cyan-500'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1 md:mr-2" />
            <span className="hidden sm:inline">My Orders</span>
          </button>
        </div>

        {/* Browse Products View */}
        {view === 'browse' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const productPacks = getPackInfo(product.moq * product.bottlesPerPack, product.bottlesPerPack);
              return (
                <div
                  key={product.id}
                  className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden hover:border-cyan-500/40 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,255,255,0.12)] hover:-translate-y-2 backdrop-blur-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  {/* Product Image */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 overflow-hidden">
                    <img
                      src={product.imageUrl || '/blunira-bottle-light.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/blunira-bottle-light.png';
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 backdrop-blur-md">
                        📦 {product.moq} pack{product.moq === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <div className="relative p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{product.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{product.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[var(--bg-elevated)] rounded-xl p-3 border border-[var(--card-border)]">
                        <div className="flex items-center gap-2 mb-1">
                          <Box className="w-3.5 h-3.5 text-cyan-500" />
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Capacity</p>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{product.capacity}</p>
                      </div>
                      <div className="bg-[var(--bg-elevated)] rounded-xl p-3 border border-[var(--card-border)]">
                        <div className="flex items-center gap-2 mb-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">MOQ</p>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{product.moq} packs</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {productPacks.packs * product.bottlesPerPack + productPacks.remaining} bottles
                        </p>
                      </div>
                    </div>

                    <div className="relative bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Price per Pack ({product.bottlesPerPack})</p>
                          <p className="text-2xl font-black text-cyan-500">₹{Number(product.pricePerPack || 0).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Per Bottle</p>
                          <p className="text-lg font-bold text-[var(--text-primary)]">
                            ₹{(Number(product.pricePerPack || 0) / product.bottlesPerPack).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cart View */}
        {view === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {cart.length === 0 ? (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
                  <ShoppingCart className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)]">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                const packInfo = getPackInfo(item.quantity, item.product.bottlesPerPack);
                const packUnitQty = item.product.moq * item.product.bottlesPerPack;
                return (
                      <div
                        key={item.product.id}
                        className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 hover:border-cyan-500/30 transition-all duration-500 backdrop-blur-xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mb-3">
                              {item.product.capacity} • ₹{(Number(item.product.pricePerPack || 0) / item.product.bottlesPerPack).toFixed(2)}/bottle
                            </p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - packUnitQty)}
                                className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--card-border)] flex items-center justify-center hover:border-cyan-500/30 transition-all cursor-pointer"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-lg font-bold text-[var(--text-primary)] min-w-[80px] text-center">
                                {item.quantity.toLocaleString()} units
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + packUnitQty)}
                                className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--card-border)] flex items-center justify-center hover:border-cyan-500/30 transition-all cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                              {packInfo.packs} pack{packInfo.packs !== 1 ? 's' : ''} + {packInfo.remaining} extra
                            </p>
                            <p className="text-xs text-cyan-500 font-bold mt-1">
                              ₹{(
                                packInfo.packs * Number(item.product.pricePerPack || 0) +
                                (packInfo.remaining > 0 ? (Number(item.product.pricePerPack || 0) / item.product.bottlesPerPack) * packInfo.remaining : 0)
                              ).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-cyan-500 mb-2">
                              ₹{(
                                packInfo.packs * Number(item.product.pricePerPack || 0) +
                                (packInfo.remaining > 0 ? (Number(item.product.pricePerPack || 0) / item.product.bottlesPerPack) * packInfo.remaining : 0)
                              ).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-xs text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Shipping Form */}
              {cart.length > 0 && (
                <div className="mt-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-500" />
                    Shipping Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          value={shippingState}
                          onChange={(e) => setShippingState(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                          placeholder="Maharashtra"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={shippingPincode}
                          onChange={(e) => setShippingPincode(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                          placeholder="400001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          GST Number
                        </label>
                        <input
                          type="text"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none"
                          placeholder="Optional"
                        />
                      </div>
                     </div>

                    {/* Delivery Options */}
                    <div className="border-t border-[var(--card-border)] pt-4 mt-2">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-cyan-500" />
                        Delivery Preferences
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                            Handle Missing / Broken Items
                          </label>
                          <select
                            value={handleMissingItems}
                            onChange={(e) => setHandleMissingItems(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none text-sm"
                          >
                            {MISSING_ITEM_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1">
                            {MISSING_ITEM_OPTIONS.find(o => o.value === handleMissingItems)?.desc}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                          Delivery Instructions
                        </label>
                        <textarea
                          value={deliveryInstructions}
                          onChange={(e) => setDeliveryInstructions(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none resize-none text-sm"
                          placeholder="e.g. Leave at security desk, call before delivery, etc."
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                          Special Handling Requirements
                        </label>
                        <textarea
                          value={specialHandling}
                          onChange={(e) => setSpecialHandling(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none resize-none text-sm"
                          placeholder="e.g. Fragile handling, temperature controlled, etc."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--card-border)] rounded-xl text-[var(--text-primary)] focus:border-cyan-500 focus:outline-none resize-none"
                        rows={3}
                        placeholder="Any special instructions..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            {cart.length > 0 && (
              <div className="lg:col-span-1">
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 sticky top-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Order Summary</h3>
                  <div className="space-y-3 mb-4 pb-4 border-b border-[var(--card-border)]">
                    {cart.map((item) => {
                      const packInfo = getPackInfo(item.quantity, item.product.bottlesPerPack);
                      const itemTotal = packInfo.packs * Number(item.product.pricePerPack || 0) + (packInfo.remaining > 0 ? (Number(item.product.pricePerPack || 0) / item.product.bottlesPerPack) * packInfo.remaining : 0);
                      return (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <div>
                            <span className="text-[var(--text-secondary)]">{item.product.name}</span>
                            <p className="text-xs text-[var(--text-muted)]">
                              {packInfo.packs} pack{packInfo.packs !== 1 ? 's' : ''} + {packInfo.remaining}
                            </p>
                          </div>
                          <span className="font-bold text-[var(--text-primary)]">
                            ₹{itemTotal.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-[var(--text-primary)]">Total</span>
                      <span className="font-black text-[var(--text-primary)]">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-cyan-500">Advance (50%)</span>
                        <span className="text-lg font-black text-cyan-500">
                          ₹{(calculateTotal() * 0.5).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Pay 50% advance to confirm your order
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={actionLoading === 'checkout'}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'checkout' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Place Order
                  </button>
                  <p className="text-xs text-[var(--text-muted)] text-center mt-3">
                    You&apos;ll be able to pay after placing the order
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders View */}
        {view === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {orders.length === 0 ? (
              <div className="col-span-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
                <FileText className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)] font-medium">No orders yet</p>
                <button
                  onClick={() => setView('browse')}
                  className="mt-4 px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-sm hover:scale-105 transition-all cursor-pointer"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              orders.map((order) => {
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-cyan-500/30 rounded-3xl p-5 md:p-6 transition-all duration-300 cursor-pointer backdrop-blur-xl"
                    onClick={() => openOrderDetail(order)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/3 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl" />

                    <div className="relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] truncate">
                              Order #{order.orderNumber}
                            </h3>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadInvoice(order);
                          }}
                          className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-all cursor-pointer shrink-0"
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="p-2.5 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Total</p>
                          <p className="text-sm font-black text-[var(--text-primary)]">₹{Number(order.totalAmount).toFixed(2)}</p>
                        </div>
                        <div className="p-2.5 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Advance</p>
                          <p className={`text-xs font-bold ${order.advancePaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {order.advancePaid ? '✓ Paid' : 'Pending'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Balance</p>
                          <p className={`text-xs font-bold ${order.fullPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {order.fullPaid ? '✓ Paid' : 'Pending'}
                          </p>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="border-t border-[var(--card-border)] pt-3 mb-3">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">Items ({order.items.length})</p>
                        <div className="space-y-1.5">
                          {order.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                              <span className="text-[var(--text-secondary)] truncate mr-2 flex items-center gap-2">
                                <Package className="w-3 h-3 text-cyan-500 shrink-0" />
                                {item.product.name} ({item.product.capacity})
                              </span>
                              <span className="text-cyan-500 font-bold whitespace-nowrap">₹{Number(item.totalPrice).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[10px] text-[var(--text-muted)] text-center">+{order.items.length - 2} more items</p>
                          )}
                        </div>
                      </div>

                      {/* Payment Banner */}
                      {order.advancePaid && order.fullPaid && (
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs text-emerald-500 font-bold">Fully Paid</span>
                        </div>
                      )}
                      {!order.advancePaid && order.status === 'PENDING' && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs text-amber-500 font-bold">Awaiting Advance Payment</span>
                        </div>
                      )}

                      {/* View Details Hint */}
                      <div className="mt-3 flex items-center gap-1 text-[10px] text-cyan-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-3 h-3" />
                        Click to view details
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      <AnimatePresence>
        {showOrderDetail && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOrderDetail(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--card-border)]" style={{ background: 'var(--bg-elevated)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[var(--text-primary)]">Order Details</h2>
                    <p className="text-xs text-[var(--text-muted)]">Order #{selectedOrder.orderNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="p-2 rounded-xl border border-[var(--card-border)] hover:border-cyan-500/30 transition-all cursor-pointer"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Section */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Current Status:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                {/* Order Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Amount</p>
                    <p className="text-lg font-black text-[var(--text-primary)]">₹{Number(selectedOrder.totalAmount).toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Advance (50%)</p>
                    <p className={`text-sm font-bold ${selectedOrder.advancePaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {selectedOrder.advancePaid ? '✓ Paid' : 'Pending'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Balance (50%)</p>
                    <p className={`text-sm font-bold ${selectedOrder.fullPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {selectedOrder.fullPaid ? '✓ Paid' : 'Pending'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Payment Status</p>
                    <p className={`text-sm font-bold ${selectedOrder.advancePaid && selectedOrder.fullPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {selectedOrder.advancePaid && selectedOrder.fullPaid ? 'Fully Paid' : 'Payment Pending'}
                    </p>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="p-5 rounded-2xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-cyan-500" />
                    Delivery & Shipping
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[var(--text-muted)] text-xs mb-1">Shipping Address</p>
                      <p className="text-[var(--text-primary)] font-medium">{selectedOrder.shippingAddress}, {selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingPincode}</p>
                    </div>
                    {selectedOrder.deliveryInstructions && (
                      <div>
                        <p className="text-[var(--text-muted)] text-xs mb-1">Delivery Instructions</p>
                        <p className="text-[var(--text-primary)] font-medium">{selectedOrder.deliveryInstructions}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[var(--text-muted)] text-xs mb-1">Missing Items Policy</p>
                      <p className="text-[var(--text-primary)] font-medium">{selectedOrder.handleMissingItems || 'REPLACE'}</p>
                    </div>
                    {selectedOrder.specialHandling && (
                      <div className="md:col-span-2">
                        <p className="text-[var(--text-muted)] text-xs mb-1">Special Handling</p>
                        <p className="text-[var(--text-primary)] font-medium">{selectedOrder.specialHandling}</p>
                      </div>
                    )}
                    {(selectedOrder.trackingNumber || selectedOrder.deliveryDate) && (
                      <div className="md:col-span-2 border-t border-[var(--card-border)] pt-3 mt-2">
                        <p className="text-[var(--text-muted)] text-xs mb-2 uppercase tracking-wider font-bold">Tracking</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {selectedOrder.trackingNumber && (
                            <div><span className="text-[var(--text-muted)]">Tracking:</span> <span className="text-[var(--text-primary)] font-bold ml-1">{selectedOrder.trackingNumber}</span></div>
                          )}
                          {selectedOrder.courierName && (
                            <div><span className="text-[var(--text-muted)]">Courier:</span> <span className="text-[var(--text-primary)] font-bold ml-1">{selectedOrder.courierName}</span></div>
                          )}
                          {selectedOrder.deliveryDate && (
                            <div><span className="text-[var(--text-muted)]">Delivery:</span> <span className="text-[var(--text-primary)] font-bold ml-1">{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</span></div>
                          )}
                          {selectedOrder.deliveredBy && (
                            <div><span className="text-[var(--text-muted)]">By:</span> <span className="text-[var(--text-primary)] font-bold ml-1">{selectedOrder.deliveredBy}</span></div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 rounded-2xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Package className="w-4 h-4 text-cyan-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{item.product.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{item.product.capacity} • Qty: {item.quantity.toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-cyan-500">₹{Number(item.totalPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment History */}
                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                  <div className="p-5 rounded-2xl border border-[var(--card-border)]" style={{ background: 'var(--bg-surface)' }}>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-cyan-500" />
                      Payment History ({selectedOrder.payments.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedOrder.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)]" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              payment.status === 'VERIFIED' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                              payment.status === 'REJECTED' ? 'bg-rose-500/10 border border-rose-500/20' :
                              'bg-amber-500/10 border border-amber-500/20'
                            }`}>
                              <CreditCard className={`w-4 h-4 ${
                                payment.status === 'VERIFIED' ? 'text-emerald-500' :
                                payment.status === 'REJECTED' ? 'text-rose-500' :
                                'text-amber-500'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-[var(--text-primary)]">₹{Number(payment.amount).toFixed(2)}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  payment.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-500' :
                                  payment.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' :
                                  'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {payment.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)]">
                                {payment.paymentType} • {payment.paymentMethod} • {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              {payment.transactionId && (
                                <p className="text-[10px] text-[var(--text-muted)] font-mono">TXN: {payment.transactionId}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadInvoice(selectedOrder)}
                            className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-all cursor-pointer shrink-0"
                            title="Download Invoice for this transaction"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                    className="flex-1 min-w-[160px] py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Invoice
                  </button>
                  <button
                    onClick={() => {
                      setShowOrderDetail(false);
                      window.location.href = `/advertiser/orders/${selectedOrder.id}/payment`;
                    }}
                    className="flex-1 min-w-[160px] py-3 border border-[var(--card-border)] rounded-xl font-bold text-sm text-[var(--text-primary)] hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    <CreditCard className="w-4 h-4 text-cyan-500" />
                    Make Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
