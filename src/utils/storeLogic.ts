import {
  FREE_SHIPPING_THRESHOLD,
  OFFERS,
  STANDARD_SHIPPING_FEE,
} from '../data/catalog';
import {
  CartItem,
  CategoryId,
  OrderRecord,
  Product,
} from '../types/store';

export interface ProductFilterOptions {
  category: CategoryId;
  subCategory?: string;
  brand?: string;
  query?: string;
  dealOnly?: boolean;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'discount';
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  mrpSavings: number;
  couponCode: string | null;
  couponDiscount: number;
  couponError: string | null;
  shippingFee: number;
  amountForFreeShipping: number;
  total: number;
}

export interface CheckoutFormInput {
  customerName: string;
  email: string;
  address: string;
  city: string;
  pinCode: string;
  paymentMethod: 'UPI' | 'Card' | 'COD';
}

export interface BookingFormInput {
  serviceId: string;
  storeId: string;
  date: string;
  timeSlot: string;
  customerName: string;
  email: string;
}

export interface ContactFormInput {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function getLocalIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDiscountPercent(price: number, mrp: number | null): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function filterProducts(
  products: Product[],
  options: ProductFilterOptions
): Product[] {
  const query = (options.query ?? '').trim().toLowerCase();
  const brandFilter = (options.brand ?? '').trim().toLowerCase();
  const subCat = (options.subCategory ?? '').trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (options.category !== 'all' && product.category !== options.category) {
      return false;
    }
    if (subCat && subCat !== 'all' && product.subCategory.toLowerCase() !== subCat) {
      return false;
    }
    if (brandFilter && brandFilter !== 'all' && product.brand.toLowerCase() !== brandFilter) {
      return false;
    }
    if (options.dealOnly && !product.mrp && product.tag !== 'Weekly Deal') {
      return false;
    }
    if (query) {
      const haystack = [
        product.name,
        product.brand,
        product.subtitle,
        product.category,
        product.subCategory,
        product.description,
        ...product.keyIngredients,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const sortBy = options.sortBy ?? 'featured';
  if (sortBy === 'price-asc') {
    return [...filtered].sort((a, b) => a.price - b.price);
  }
  if (sortBy === 'price-desc') {
    return [...filtered].sort((a, b) => b.price - a.price);
  }
  if (sortBy === 'discount') {
    return [...filtered].sort(
      (a, b) => getDiscountPercent(b.price, b.mrp) - getDiscountPercent(a.price, a.mrp)
    );
  }
  return filtered;
}

export function calculateCartTotals(
  items: CartItem[],
  rawCouponCode?: string | null
): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const mrpSavings = items.reduce((sum, item) => {
    if (!item.mrp || item.mrp <= item.price) return sum;
    return sum + (item.mrp - item.price) * item.quantity;
  }, 0);

  const nonGiftSubtotal = items.reduce(
    (sum, item) => (item.isGiftCard ? sum : sum + item.price * item.quantity),
    0
  );

  const normalizedCode = (rawCouponCode ?? '').trim().toUpperCase();
  let couponCode: string | null = null;
  let couponDiscount = 0;
  let couponError: string | null = null;

  if (normalizedCode) {
    const offer = OFFERS.find((o) => o.code === normalizedCode);
    if (!offer) {
      couponError = `Coupon "${normalizedCode}" is not recognized. Try GLOW15 or BEAUTY500.`;
    } else if (nonGiftSubtotal === 0) {
      couponError = 'Coupons apply to beauty products only (not Gift Cards).';
    } else if (nonGiftSubtotal < offer.minSpend) {
      couponError = `Add ${formatINR(offer.minSpend - nonGiftSubtotal)} more in products to unlock ${offer.code}.`;
    } else {
      couponCode = offer.code;
      couponDiscount =
        offer.discountType === 'percent'
          ? Math.round((nonGiftSubtotal * offer.discountValue) / 100)
          : Math.min(offer.discountValue, nonGiftSubtotal);
    }
  }

  const merchandiseAfterDiscount = Math.max(0, subtotal - couponDiscount);
  const allGiftCards = items.length > 0 && items.every((item) => item.isGiftCard);
  const shippingFee =
    items.length === 0 || allGiftCards || merchandiseAfterDiscount >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;

  const amountForFreeShipping =
    allGiftCards || merchandiseAfterDiscount >= FREE_SHIPPING_THRESHOLD
      ? 0
      : FREE_SHIPPING_THRESHOLD - merchandiseAfterDiscount;

  return {
    itemCount,
    subtotal,
    mrpSavings,
    couponCode,
    couponDiscount,
    couponError,
    shippingFee,
    amountForFreeShipping,
    total: merchandiseAfterDiscount + shippingFee,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^[1-9][0-9]{5}$/;

export interface CustomerProfileFormInput {
  displayName: string;
  email?: string;
  phoneNumber?: string;
  defaultAddress: string;
  defaultCity: string;
  defaultPinCode: string;
}

export function validateEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function normalizeIndianPhoneNumber(raw: string): string {
  return normalizePhoneNumberWithCountry(raw, '+91');
}

export function normalizePhoneNumberWithCountry(raw: string, countryDialCode = '+91'): string {
  const cleaned = raw.replace(/[\s()-]/g, '').trim();
  if (!cleaned) return '';
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) return cleaned;
  const dial = countryDialCode.startsWith('+') ? countryDialCode : `+${countryDialCode}`;
  const dialDigits = dial.replace(/\D/g, '');
  if (dialDigits === '91') {
    if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
    if (/^0[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned.slice(1)}`;
    if (/^91[6-9]\d{9}$/.test(cleaned)) return `+${cleaned}`;
    return '';
  }
  const nationalDigits = cleaned.replace(/^0+/, '');
  if (!/^\d{6,14}$/.test(nationalDigits)) return '';
  const combined = `+${dialDigits}${nationalDigits}`;
  return /^\+[1-9]\d{7,14}$/.test(combined) ? combined : '';
}

export function validatePhoneNumberInput(raw: string, countryDialCode = '+91'): string | null {
  if (!raw.trim()) {
    return 'Enter your mobile number.';
  }
  const normalized = normalizePhoneNumberWithCountry(raw, countryDialCode);
  if (!normalized) {
    return countryDialCode === '+91'
      ? 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210) or include country code (+91...).'
      : `Enter a valid mobile number for ${countryDialCode} or type full +<country> format.`;
  }
  return null;
}

export function validateEmailAuthForm(
  mode: 'signin' | 'register',
  input: { fullName?: string; email: string; password: string }
): Record<string, string> {
  const errors: Record<string, string> = {};
  const email = input.email.trim();
  const password = input.password;

  if (mode === 'register') {
    const name = (input.fullName ?? '').trim();
    if (name.length < 2 || name.length > 120) {
      errors.fullName = 'Enter your full name (2 to 120 characters).';
    }
  }
  if (!EMAIL_RE.test(email) || email.length > 160) {
    errors.email = 'Enter a valid email address.';
  }
  if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  } else if (password.length > 128) {
    errors.password = 'Keep password under 128 characters.';
  }
  return errors;
}

export function mapFirebaseAuthError(code: string, hostname = ''): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was closed before completing login.';
    case 'auth/popup-blocked':
      return 'Popup blocked by browser. Please allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
    case 'auth/app-not-authorized':
      return `Domain "${hostname}" is not in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    case 'auth/web-storage-unsupported':
      return 'Browser storage or third-party cookies are blocked. Enable cookies/storage and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled yet. Enable Email/Password, Google, Microsoft, or Apple in Firebase Console -> Authentication -> Sign-in method.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email under another sign-in method. Please continue with your original provider (Google, Microsoft, Apple, or Email ID).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email address or password. Please check and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Switch to Sign In with Email ID.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 6 characters).';
    case 'auth/too-many-requests':
      return 'Too many attempts detected. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'Network error while reaching Firebase Authentication. Check your connection and try again.';
    default:
      return code
        ? `Unable to complete sign-in right now (${code}). Please try again.`
        : 'Unable to complete sign-in right now. Please try again.';
  }
}

export function validateCustomerProfileForm(
  form: CustomerProfileFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.displayName.trim();
  const email = (form.email ?? '').trim();
  const phone = (form.phoneNumber ?? '').trim();
  const addr = form.defaultAddress.trim();
  const city = form.defaultCity.trim();
  const pin = form.defaultPinCode.trim();

  if (name.length < 2 || name.length > 120) {
    errors.displayName = 'Enter a display name between 2 and 120 characters.';
  }
  if (email.length > 0 && (!EMAIL_RE.test(email) || email.length > 160)) {
    errors.email = 'Enter a valid email address (or leave blank).';
  }
  if (phone.length > 0 && !normalizePhoneNumberWithCountry(phone, '+91')) {
    errors.phoneNumber = 'Enter a valid mobile number (or leave blank).';
  }
  if (addr.length > 0 && (addr.length < 5 || addr.length > 300)) {
    errors.defaultAddress = 'Street address must be 5 to 300 characters (or leave blank).';
  }
  if (city.length > 0 && (city.length < 2 || city.length > 80)) {
    errors.defaultCity = 'City must be 2 to 80 characters (or leave blank).';
  }
  if (pin.length > 0 && !PIN_RE.test(pin)) {
    errors.defaultPinCode = 'Enter a valid 6-digit Indian PIN code (e.g. 400050).';
  }
  return errors;
}

export function formatOrderItemsSummary(items: CartItem[]): {
  itemsSummary: string;
  itemCount: number;
} {
  const rawCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemCount = Math.max(1, Math.min(100, Math.round(rawCount)));
  const joined = items
    .map((item) => `${item.brand} ${item.name} (${item.variantLabel}) × ${item.quantity}`)
    .join('; ')
    .trim();
  const itemsSummary = (joined || 'Beauty Order Items').slice(0, 600);
  return { itemsSummary, itemCount };
}

export function validateCheckoutForm(
  form: CheckoutFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.customerName.trim();
  const email = form.email.trim();
  const address = form.address.trim();
  const city = form.city.trim();

  if (name.length < 2 || name.length > 120) {
    errors.customerName = 'Enter your full name (2 to 120 characters).';
  }
  if (!EMAIL_RE.test(email) || email.length > 160) {
    errors.email = 'Enter a valid email address for order confirmation.';
  }
  if (address.length < 5 || address.length > 300) {
    errors.address = 'Enter a street address between 5 and 300 characters.';
  }
  if (city.length < 2 || city.length > 80) {
    errors.city = 'Enter your city (2 to 80 characters).';
  }
  if (!PIN_RE.test(form.pinCode.trim())) {
    errors.pinCode = 'Enter a valid 6-digit PIN code.';
  }
  return errors;
}

export function validateBookingForm(
  form: BookingFormInput & { notes?: string },
  minDate = getLocalIsoDate(0)
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.customerName.trim();
  const email = form.email.trim();
  const trimmedDate = form.date.trim();

  if (!form.serviceId) errors.serviceId = 'Select a studio service.';
  if (!form.storeId) errors.storeId = 'Select a flagship store.';
  if (!trimmedDate) {
    errors.date = 'Choose a preferred date.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    errors.date = 'Enter a valid booking date.';
  } else if (trimmedDate < minDate) {
    errors.date = 'Please choose today or an upcoming date.';
  }
  if (!form.timeSlot) errors.timeSlot = 'Choose a time slot.';
  if (name.length < 2 || name.length > 120) {
    errors.customerName = 'Enter your full name (2 to 120 characters).';
  }
  if (!EMAIL_RE.test(email) || email.length > 160) {
    errors.email = 'Enter a valid email address.';
  }
  if ((form.notes ?? '').trim().length > 400) {
    errors.notes = 'Keep skin/hair notes under 400 characters.';
  }
  return errors;
}

export function validateContactForm(
  form: ContactFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.name.trim().length < 2) errors.name = 'Enter your name.';
  if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (form.message.trim().length < 10) {
    errors.message = 'Please share at least 10 characters so our team can help.';
  }
  return errors;
}

export function lookupOrder(
  orders: OrderRecord[],
  orderNumber: string
): OrderRecord | null {
  const normalized = orderNumber.trim().toUpperCase();
  if (!normalized) return null;
  return orders.find((o) => o.orderNumber.toUpperCase() === normalized) ?? null;
}

export function generateOrderNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `BF-${num}`;
}
