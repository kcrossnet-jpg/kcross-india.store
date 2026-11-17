import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, SEEDED_ORDERS } from '../data/catalog';
import {
  calculateCartTotals,
  filterProducts,
  formatINR,
  formatOrderItemsSummary,
  lookupOrder,
  validateBookingForm,
  validateCheckoutForm,
  validateContactForm,
  validateCustomerProfileForm,
} from './storeLogic';
import { CartItem } from '../types/store';

test('filterProducts filters by category, brand, query, and sorts', () => {
  const hairItems = filterProducts(PRODUCTS, { category: 'hair' });
  assert.ok(hairItems.length >= 3);
  assert.ok(hairItems.every((p) => p.category === 'hair'));

  const olaplex = filterProducts(PRODUCTS, { category: 'all', brand: 'OLAPLEX' });
  assert.equal(olaplex.length, 2);

  const search = filterProducts(PRODUCTS, { category: 'all', query: 'snail' });
  assert.equal(search.length, 1);
  assert.equal(search[0].brand, 'COSRX');

  const asc = filterProducts(PRODUCTS, { category: 'all', sortBy: 'price-asc' });
  assert.ok(asc[0].price <= asc[1].price);
});

test('calculateCartTotals computes subtotal, coupons, and free shipping threshold', () => {
  const sampleItems: CartItem[] = [
    {
      key: 'bf-5::Sand Beige 02',
      productId: 'bf-5',
      brand: 'Faces Canada',
      name: 'High Cover Concealer',
      variantLabel: 'Sand Beige 02',
      price: 349,
      mrp: 499,
      quantity: 2,
      visualForm: 'concealer',
      surfaceTone: '#F6ECE9',
      accentTone: '#9C4B5C',
    },
  ];

  // Subtotal = 698 (< 999), so shipping = 99
  const base = calculateCartTotals(sampleItems);
  assert.equal(base.subtotal, 698);
  assert.equal(base.mrpSavings, 300);
  assert.equal(base.shippingFee, 99);
  assert.equal(base.total, 797);
  assert.equal(base.amountForFreeShipping, 301);

  // Coupon GLOW15 gives 15% off (105)
  const withGlow = calculateCartTotals(sampleItems, 'glow15');
  assert.equal(withGlow.couponCode, 'GLOW15');
  assert.equal(withGlow.couponDiscount, 105);
  assert.equal(withGlow.couponError, null);
  assert.equal(withGlow.total, 698 - 105 + 99);

  // Coupon BEAUTY500 requires 3499
  const belowMin = calculateCartTotals(sampleItems, 'BEAUTY500');
  assert.equal(belowMin.couponCode, null);
  assert.ok(belowMin.couponError?.includes('BEAUTY500'));
});

test('calculateCartTotals waives shipping on digital gift cards', () => {
  const giftItem: CartItem[] = [
    {
      key: 'gift::2500',
      productId: 'gift-card',
      brand: 'kcross india store',
      name: 'kcross india store Digital Gift Card',
      variantLabel: '₹2,500 E-Gift',
      price: 500,
      mrp: null,
      quantity: 1,
      visualForm: 'giftcard',
      surfaceTone: '#F6ECEF',
      accentTone: '#C41E68',
      isGiftCard: true,
    },
  ];
  const totals = calculateCartTotals(giftItem, 'GLOW15');
  assert.equal(totals.shippingFee, 0);
  assert.equal(totals.couponDiscount, 0);
  assert.ok(totals.couponError?.includes('Gift Cards'));
});

test('validateCheckoutForm and validateBookingForm catch empty/invalid inputs', () => {
  const badCheckout = validateCheckoutForm({
    customerName: 'A',
    email: 'invalid-email',
    address: '123',
    city: '',
    pinCode: '123',
    paymentMethod: 'UPI',
  });
  assert.ok(badCheckout.customerName);
  assert.ok(badCheckout.email);
  assert.ok(badCheckout.address);
  assert.ok(badCheckout.city);
  assert.ok(badCheckout.pinCode);

  const oversizedCheckout = validateCheckoutForm({
    customerName: 'Priya Nair',
    email: 'priya@example.in',
    address: 'A'.repeat(305),
    city: 'Mumbai',
    pinCode: '400020',
    paymentMethod: 'UPI',
  });
  assert.ok(oversizedCheckout.address);

  const goodCheckout = validateCheckoutForm({
    customerName: 'Priya Nair',
    email: 'priya@example.in',
    address: '14 Marine Drive, Churchgate',
    city: 'Mumbai',
    pinCode: '400020',
    paymentMethod: 'COD',
  });
  assert.deepEqual(goodCheckout, {});

  const badBooking = validateBookingForm({
    serviceId: '',
    storeId: '',
    date: '',
    timeSlot: '',
    customerName: '',
    email: 'bad',
    notes: 'N'.repeat(405),
  });
  assert.ok(badBooking.serviceId && badBooking.email && badBooking.notes);

  const badContact = validateContactForm({
    name: '',
    email: 'nope',
    topic: 'Order',
    message: 'hi',
  });
  assert.ok(badContact.name && badContact.email && badContact.message);
});

test('lookupOrder finds seeded orders case-insensitively and formatINR formats cleanly', () => {
  const found = lookupOrder(SEEDED_ORDERS, 'lk-204518');
  assert.ok(found);
  assert.equal(found.status, 'In Transit');
  assert.equal(lookupOrder(SEEDED_ORDERS, 'UNKNOWN-999'), null);
  assert.equal(formatINR(4550), '₹4,550');
});

test('validateCustomerProfileForm and formatOrderItemsSummary enforce blueprint bounds', () => {
  const badProfile = validateCustomerProfileForm({
    displayName: 'A',
    defaultAddress: 'abc',
    defaultCity: 'X',
    defaultPinCode: '012345',
  });
  assert.ok(badProfile.displayName);
  assert.ok(badProfile.defaultAddress);
  assert.ok(badProfile.defaultCity);
  assert.ok(badProfile.defaultPinCode);

  const goodProfile = validateCustomerProfileForm({
    displayName: 'Meera Krishnan',
    defaultAddress: '',
    defaultCity: '',
    defaultPinCode: '',
  });
  assert.deepEqual(goodProfile, {});

  const summary = formatOrderItemsSummary([
    {
      key: 'bf-2::250 ml',
      productId: 'bf-2',
      brand: 'OLAPLEX',
      name: 'No. 4 Bond Maintenance Shampoo',
      variantLabel: '250 ml',
      price: 2950,
      mrp: 3200,
      quantity: 2,
      visualForm: 'shampoo',
      surfaceTone: '#F6F3EE',
      accentTone: '#2E2925',
    },
  ]);
  assert.equal(summary.itemCount, 2);
  assert.ok(summary.itemsSummary.includes('OLAPLEX No. 4 Bond Maintenance Shampoo (250 ml) × 2'));
});
