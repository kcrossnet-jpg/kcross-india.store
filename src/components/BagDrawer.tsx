import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShoppingBag, Trash2, X } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD, PRODUCTS } from '../data/catalog';
import { CartItem, OrderRecord } from '../types/store';
import {
  calculateCartTotals,
  formatINR,
  generateOrderNumber,
  validateCheckoutForm,
} from '../utils/storeLogic';
import { ProductArt } from './ProductArt';

interface BagDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  appliedCoupon: string | null;
  defaultCustomer?: {
    name?: string;
    email?: string;
    address?: string;
    city?: string;
    pinCode?: string;
  };
  onClose: () => void;
  onUpdateQuantity: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onApplyCoupon: (code: string | null) => void;
  onPlaceOrder: (order: OrderRecord) => void;
  onTrackOrder: (orderNumber: string) => void;
}

export const BagDrawer: React.FC<BagDrawerProps> = ({
  isOpen,
  items,
  appliedCoupon,
  defaultCustomer,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onPlaceOrder,
  onTrackOrder,
}) => {
  const [step, setStep] = useState<'bag' | 'checkout' | 'confirmed'>('bag');
  const [couponInput, setCouponInput] = useState<string>(appliedCoupon ?? '');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'COD'>('UPI');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [latestOrder, setLatestOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    setCouponInput(appliedCoupon ?? '');
  }, [appliedCoupon]);

  useEffect(() => {
    if (!isOpen || !defaultCustomer) return;
    setCustomerName((prev) => prev || defaultCustomer.name || '');
    setEmail((prev) => prev || defaultCustomer.email || '');
    setAddress((prev) => prev || defaultCustomer.address || '');
    setCity((prev) => prev || defaultCustomer.city || '');
    setPinCode((prev) => prev || defaultCustomer.pinCode || '');
  }, [isOpen, defaultCustomer]);

  useEffect(() => {
    if (!isOpen) {
      if (step === 'confirmed') {
        setStep('bag');
      }
      return;
    }
    if (items.length > 0 && step === 'confirmed') {
      setStep('bag');
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, items.length, step, onClose]);

  if (!isOpen) return null;

  const totals = calculateCartTotals(items, appliedCoupon);
  const progressPct = Math.min(
    100,
    Math.round(((FREE_SHIPPING_THRESHOLD - totals.amountForFreeShipping) / FREE_SHIPPING_THRESHOLD) * 100)
  );

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = couponInput.trim().toUpperCase();
    onApplyCoupon(trimmed || null);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCheckoutForm({
      customerName,
      email,
      address,
      city,
      pinCode,
      paymentMethod,
    });
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const order: OrderRecord = {
      orderNumber: generateOrderNumber(),
      placedAt: new Date().toISOString(),
      status: 'Confirmed',
      paymentMethod,
      customerName: customerName.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      pinCode: pinCode.trim(),
      items: [...items],
      subtotal: totals.subtotal,
      couponCode: totals.couponCode,
      couponDiscount: totals.couponDiscount,
      shippingFee: totals.shippingFee,
      total: totals.total,
      estimatedDelivery: 'Dispatching within 24 hours · 2–4 working days',
    };

    onPlaceOrder(order);
    setLatestOrder(order);
    setStep('confirmed');
    setCustomerName(defaultCustomer?.name ?? '');
    setEmail(defaultCustomer?.email ?? '');
    setAddress(defaultCustomer?.address ?? '');
    setCity(defaultCustomer?.city ?? '');
    setPinCode(defaultCustomer?.pinCode ?? '');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1C1613]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full sm:max-w-md flex-col bg-[#FCF9F5] shadow-2xl border-l border-[#EAE1D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#EAE1D8] bg-white px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="flex items-center gap-2">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('bag')}
                aria-label="Back to bag"
                className="mr-1 rounded-lg p-1.5 text-[#1C1613] hover:bg-[#F3ECE4]"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="font-display text-xl font-medium text-[#1C1613]">
              {step === 'bag'
                ? `Shopping Bag (${totals.itemCount})`
                : step === 'checkout'
                  ? 'Delivery & Payment'
                  : 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EAE1D8] text-[#1C1613] hover:bg-[#F3ECE4]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5">
          {step === 'confirmed' && latestOrder ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#C6DFCB] bg-[#F3FAF5] p-5">
                <div className="flex items-center gap-2 text-[#1E462A]">
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-semibold">Order Placed Successfully</span>
                </div>
                <p className="mt-2 text-xs text-[#2D5A3B]">
                  Order <strong className="font-mono-num">{latestOrder.orderNumber}</strong> is
                  confirmed. A receipt has been prepared for {latestOrder.email}.
                </p>
              </div>

              <div className="rounded-xl border border-[#EAE1D8] bg-white p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6E6058]">Recipient</span>
                  <span className="font-semibold text-[#1C1613]">{latestOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6058]">Delivery Address</span>
                  <span className="font-medium text-[#1C1613] text-right max-w-[60%]">
                    {latestOrder.address}, {latestOrder.city} — {latestOrder.pinCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E6058]">Payment</span>
                  <span className="font-semibold text-[#1C1613]">{latestOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between border-t border-[#F3ECE4] pt-2.5 text-sm font-bold text-[#1C1613] tabular-nums">
                  <span>Total Paid</span>
                  <span>{formatINR(latestOrder.total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onTrackOrder(latestOrder.orderNumber);
                  setStep('bag');
                  onClose();
                }}
                className="w-full rounded-lg bg-[#C2410C] px-4 py-3 text-sm font-semibold text-white hover:bg-[#9A3412]"
              >
                Track Order {latestOrder.orderNumber}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag className="h-10 w-10 text-[#8A7B72] mx-auto" aria-hidden="true" />
              <h3 className="font-display text-xl font-medium text-[#1C1613]">
                Your bag is empty
              </h3>
              <p className="text-xs text-[#6E6058] max-w-[30ch] mx-auto">
                Add skincare, fragrances, haircare, or a gift card to unlock free shipping over
                ₹999.
              </p>
            </div>
          ) : step === 'bag' ? (
            <>
              {/* Free shipping meter */}
              <div className="rounded-xl border border-[#EAE1D8] bg-white p-3.5">
                <p className="text-xs text-[#1C1613]">
                  {totals.amountForFreeShipping === 0
                    ? 'You unlocked free pan-India shipping.'
                    : `Add ${formatINR(totals.amountForFreeShipping)} more for free shipping (orders over ₹999).`}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[#F5EFE8] overflow-hidden">
                  <div
                    className="h-full bg-[#C2410C] transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="flex gap-3.5 rounded-xl border border-[#EAE1D8] bg-white p-3"
                  >
                    <ProductArt
                      form={item.visualForm}
                      brand={item.brand}
                      surfaceTone={item.surfaceTone}
                      accentTone={item.accentTone}
                      imageUrl={
                        PRODUCTS.find((p) => p.id === item.productId)?.imageUrl
                      }
                      imageAlt={`${item.brand} ${item.name}`}
                      className="h-20 w-20 shrink-0 rounded-lg"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6058]">
                            {item.brand}
                          </span>
                          <p className="text-sm font-semibold text-[#1C1613] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#6E6058] truncate">{item.variantLabel}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.key)}
                          aria-label={`Remove ${item.name} from bag`}
                          className="p-1 text-[#6E6058] hover:text-[#B91C1C]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-md border border-[#EAE1D8] bg-[#FCF9F5]">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.key, -1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="px-2 py-1 text-xs font-semibold text-[#1C1613] hover:bg-[#F5EFE8]"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.key, 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="px-2 py-1 text-xs font-semibold text-[#1C1613] hover:bg-[#F5EFE8]"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-[#1C1613] tabular-nums">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <form onSubmit={handleCouponSubmit} className="rounded-xl border border-[#EAE1D8] bg-white p-3.5 space-y-2">
                <label htmlFor="coupon-input" className="block text-xs font-semibold text-[#1C1613]">
                  Promo Code (try GLOW15 or BEAUTY500)
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon-input"
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 min-w-0 rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2 text-xs font-mono-num uppercase text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#1C1613] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#332924] whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {totals.couponError && (
                  <p className="text-xs text-[#B91C1C]">{totals.couponError}</p>
                )}
                {totals.couponCode && (
                  <div className="flex items-center justify-between text-xs text-[#2E6F40]">
                    <span>
                      Code <strong>{totals.couponCode}</strong> applied (−
                      {formatINR(totals.couponDiscount)})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCouponInput('');
                        onApplyCoupon(null);
                      }}
                      className="underline text-[#6E6058]"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </form>
            </>
          ) : (
            /* Checkout Step */
            <form id="checkout-form" onSubmit={handleCheckoutSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="co-name" className="block text-xs font-semibold text-[#1C1613] mb-1">
                  Full Name
                </label>
                <input
                  id="co-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-[#EAE1D8] bg-white px-3 py-2.5 text-sm focus:border-[#C2410C] focus:outline-none"
                />
                {errors.customerName && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="co-email" className="block text-xs font-semibold text-[#1C1613] mb-1">
                  Email
                </label>
                <input
                  id="co-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#EAE1D8] bg-white px-3 py-2.5 text-sm focus:border-[#C2410C] focus:outline-none"
                />
                {errors.email && <p className="mt-1 text-xs text-[#B91C1C]">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="co-address" className="block text-xs font-semibold text-[#1C1613] mb-1">
                  Street Address
                </label>
                <textarea
                  id="co-address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat / House No., Building, Street"
                  className="w-full rounded-lg border border-[#EAE1D8] bg-white px-3 py-2 text-sm focus:border-[#C2410C] focus:outline-none"
                />
                {errors.address && <p className="mt-1 text-xs text-[#B91C1C]">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="co-city" className="block text-xs font-semibold text-[#1C1613] mb-1">
                    City
                  </label>
                  <input
                    id="co-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full rounded-lg border border-[#EAE1D8] bg-white px-3 py-2.5 text-sm focus:border-[#C2410C] focus:outline-none"
                  />
                  {errors.city && <p className="mt-1 text-xs text-[#B91C1C]">{errors.city}</p>}
                </div>
                <div>
                  <label htmlFor="co-pin" className="block text-xs font-semibold text-[#1C1613] mb-1">
                    PIN Code
                  </label>
                  <input
                    id="co-pin"
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="400050"
                    className="w-full rounded-lg border border-[#EAE1D8] bg-white px-3 py-2.5 text-sm font-mono-num focus:border-[#C2410C] focus:outline-none"
                  />
                  {errors.pinCode && (
                    <p className="mt-1 text-xs text-[#B91C1C]">{errors.pinCode}</p>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#1C1613] mb-2">
                  Payment Method
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Card', 'COD'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-lg border px-2 py-2.5 text-xs font-semibold leading-tight transition-colors ${
                        paymentMethod === method
                          ? 'border-[#C2410C] bg-[#C2410C]/10 text-[#C2410C]'
                          : 'border-[#EAE1D8] bg-white text-[#1C1613]'
                      }`}
                    >
                      {method === 'COD' ? 'Cash on Delivery' : method}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && step !== 'confirmed' && (
          <div className="border-t border-[#EAE1D8] bg-white p-4 sm:p-5 space-y-3">
            <div className="space-y-1.5 text-xs tabular-nums">
              <div className="flex justify-between text-[#6E6058]">
                <span>Subtotal</span>
                <span>{formatINR(totals.subtotal)}</span>
              </div>
              {totals.mrpSavings > 0 && (
                <div className="flex justify-between text-[#2E6F40]">
                  <span>MRP Markdown Savings</span>
                  <span>−{formatINR(totals.mrpSavings)}</span>
                </div>
              )}
              {totals.couponDiscount > 0 && (
                <div className="flex justify-between text-[#C2410C]">
                  <span>Coupon ({totals.couponCode})</span>
                  <span>−{formatINR(totals.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6E6058]">
                <span>Shipping</span>
                <span>{totals.shippingFee === 0 ? 'Free' : formatINR(totals.shippingFee)}</span>
              </div>
              <div className="flex justify-between border-t border-[#F3ECE4] pt-2 text-base font-bold text-[#1C1613]">
                <span>Total</span>
                <span>{formatINR(totals.total)}</span>
              </div>
            </div>

            {step === 'bag' ? (
              <button
                key="proceed-to-checkout"
                type="button"
                onClick={() => {
                  setErrors({});
                  setStep('checkout');
                }}
                className="w-full rounded-lg bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412]"
              >
                Proceed to Checkout
              </button>
            ) : (
              <button
                key="place-order-submit"
                type="submit"
                form="checkout-form"
                className="w-full rounded-lg bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412]"
              >
                Place Order · {formatINR(totals.total)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
