export type CategoryId =
  | 'all'
  | 'makeup'
  | 'skin'
  | 'hair'
  | 'fragrance'
  | 'bath-body'
  | 'mom-baby'
  | 'appliances';

export type VisualForm =
  | 'serum'
  | 'cleanser'
  | 'jar'
  | 'lipstick'
  | 'concealer'
  | 'shampoo'
  | 'mask'
  | 'perfume'
  | 'mist'
  | 'appliance'
  | 'lotion'
  | 'baby'
  | 'giftcard';

export interface ProductVariant {
  label: string;
  price: number;
  mrp: number | null;
  swatchHex?: string;
}

export interface Product {
  id: string;
  slug: string;
  category: Exclude<CategoryId, 'all'>;
  subCategory: string;
  brand: string;
  name: string;
  subtitle: string;
  price: number;
  mrp: number | null;
  tag?: 'Bestseller' | 'Weekly Deal' | 'New' | 'Luxury' | 'Salon Pro';
  rating: number;
  reviewCount: number;
  inStock: boolean;
  visualForm: VisualForm;
  imageUrl?: string;
  surfaceTone: string;
  accentTone: string;
  description: string;
  keyIngredients: string[];
  howToUse: string;
  variants: ProductVariant[];
}

export interface CategoryInfo {
  id: Exclude<CategoryId, 'all'>;
  label: string;
  tagline: string;
  subCategories: string[];
  accentTone: string;
}

export interface BrandInfo {
  id: string;
  name: string;
  origin: string;
  tier: 'Luxury' | 'Derm Skincare' | 'Salon Pro' | 'Everyday Beauty';
  specialty: string;
  highlight: string;
}

export interface StoreLocation {
  id: string;
  city: string;
  name: string;
  address: string;
  hours: string;
  servicesAvailable: string[];
}

export interface BeautyService {
  id: string;
  name: string;
  category: 'Skin' | 'Hair' | 'Makeup' | 'Fragrance';
  duration: string;
  priceLabel: string;
  fee: number;
  summary: string;
  includes: string[];
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  storeId: string;
  storeName: string;
  date: string;
  timeSlot: string;
  customerName: string;
  email: string;
  notes: string;
  status: 'Confirmed' | 'Pending';
  createdAt: string;
}

export interface OfferItem {
  code: string;
  title: string;
  description: string;
  minSpend: number;
  discountType: 'percent' | 'flat';
  discountValue: number;
  validNote: string;
}

export interface CartItem {
  key: string;
  productId: string;
  brand: string;
  name: string;
  variantLabel: string;
  price: number;
  mrp: number | null;
  quantity: number;
  visualForm: VisualForm;
  imageUrl?: string;
  surfaceTone: string;
  accentTone: string;
  isGiftCard?: boolean;
  giftRecipientEmail?: string;
  giftMessage?: string;
}

export interface OrderRecord {
  orderNumber: string;
  placedAt: string;
  status: 'Confirmed' | 'Packed' | 'In Transit' | 'Delivered';
  paymentMethod: 'UPI' | 'Card' | 'COD';
  customerName: string;
  email: string;
  address: string;
  city: string;
  pinCode: string;
  items: CartItem[];
  subtotal: number;
  couponCode: string | null;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  estimatedDelivery: string;
}

export interface CustomerProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  defaultAddress: string;
  defaultCity: string;
  defaultPinCode: string;
  wishlistIds: string[];
}

export type ActiveView =
  | 'home'
  | 'catalog'
  | 'brands'
  | 'services'
  | 'offers'
  | 'gift-cards'
  | 'wishlist'
  | 'track-order'
  | 'login'
  | 'returns'
  | 'shipping'
  | 'faq'
  | 'contact'
  | 'our-story'
  | 'ingredients';
