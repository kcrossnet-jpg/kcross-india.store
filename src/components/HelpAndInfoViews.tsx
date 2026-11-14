import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, PackageSearch, Trash2 } from 'lucide-react';
import { PRODUCTS } from '../data/catalog';
import { OrderRecord, Product } from '../types/store';
import { formatINR, lookupOrder, validateContactForm } from '../utils/storeLogic';
import { ProductCard } from './ProductCard';

interface WishlistViewProps {
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onBrowseCatalog: () => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistIds,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
  onBrowseCatalog,
}) => {
  const savedProducts = PRODUCTS.filter((p) => wishlistIds.includes(p.id));

  return (
    <section className="py-10 space-y-8">
      <div className="border-b border-[#EAE4E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">Saved Edit</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
          Your Wishlist ({savedProducts.length})
        </h1>
      </div>

      {savedProducts.length === 0 ? (
        <div className="rounded-2xl border border-[#EAE4E0] bg-white p-8 sm:p-12 text-center space-y-3">
          <h2 className="font-display text-2xl font-medium text-[#1E161A]">
            No saved products yet
          </h2>
          <p className="text-sm text-[#6E5F66]">
            Tap the heart icon on any cleanser, fragrance, or hair tool to shortlist it here.
          </p>
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="mt-2 rounded-lg bg-[#C41E68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A61757]"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={true}
              onSelect={onSelectProduct}
              onQuickAdd={onQuickAdd}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </section>
  );
};

interface TrackOrderViewProps {
  orders: OrderRecord[];
  initialOrderNumber?: string;
}

const ORDER_STEPS: Array<OrderRecord['status']> = [
  'Confirmed',
  'Packed',
  'In Transit',
  'Delivered',
];

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({
  orders,
  initialOrderNumber = '',
}) => {
  const [query, setQuery] = useState(initialOrderNumber);
  const [searched, setSearched] = useState<string>(initialOrderNumber);

  useEffect(() => {
    if (initialOrderNumber) {
      setQuery(initialOrderNumber);
      setSearched(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const found = searched ? lookupOrder(orders, searched) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(query.trim());
  };

  return (
    <section className="py-10 space-y-8 max-w-3xl">
      <div className="border-b border-[#EAE4E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
          Order Lookup
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
          Track Your Order
        </h1>
        <p className="mt-1.5 text-sm text-[#6E5F66]">
          Enter your order ID (try <code className="font-mono-num text-[#1E161A]">LK-204518</code>{' '}
          or <code className="font-mono-num text-[#1E161A]">BF-104200</code>, or any order you
          placed).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <label htmlFor="track-order-input" className="sr-only">
          Order Number
        </label>
        <input
          id="track-order-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. LK-204518 or BF-104200"
          className="flex-1 min-w-[220px] rounded-lg border border-[#EAE4E0] bg-white px-4 py-3 text-sm font-mono-num uppercase text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-[#C41E68] px-5 py-3 text-sm font-semibold text-white hover:bg-[#A61757]"
        >
          <PackageSearch className="h-4 w-4" aria-hidden="true" />
          <span>Track Order</span>
        </button>
      </form>

      {searched && !found && (
        <div className="rounded-xl border border-[#F5C2C7] bg-[#FDF2F2] p-4 text-sm text-[#842029]">
          No order found for <strong className="font-mono-num">{searched}</strong>. Double-check
          the code or try <strong className="font-mono-num">LK-204518</strong>.
        </div>
      )}

      {found && (
        <div className="rounded-2xl border border-[#EAE4E0] bg-white p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3EFEC] pb-4">
            <div>
              <span className="font-mono-num text-lg font-bold text-[#1E161A]">
                {found.orderNumber}
              </span>
              <p className="text-xs text-[#6E5F66] mt-0.5">{found.estimatedDelivery}</p>
            </div>
            <span className="text-xs font-semibold text-[#C41E68]">
              Status: {found.status} · {found.paymentMethod}
            </span>
          </div>

          {/* 4-step Progress */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {ORDER_STEPS.map((st, idx) => {
              const currentIdx = ORDER_STEPS.indexOf(found.status);
              const done = idx <= currentIdx;
              return (
                <div key={st} className="space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      done ? 'bg-[#C41E68]' : 'bg-[#EFEBE8]'
                    }`}
                  />
                  <span
                    className={`block text-[10px] sm:text-[11px] font-semibold ${
                      done ? 'text-[#1E161A]' : 'text-[#8B7D84]'
                    }`}
                  >
                    {st}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Items */}
          <div className="space-y-2 border-t border-[#F3EFEC] pt-4 text-sm">
            {found.items.map((item) => (
              <div key={item.key} className="flex justify-between gap-3 tabular-nums">
                <span className="text-[#1E161A] min-w-0">
                  {item.brand} {item.name} ({item.variantLabel}) × {item.quantity}
                </span>
                <span className="font-semibold text-[#1E161A] shrink-0">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-[#F3EFEC] pt-3 font-bold text-[#1E161A] tabular-nums">
              <span>Order Total</span>
              <span>{formatINR(found.total)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export const ContactView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Order & Shipping');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateContactForm({ name, email, topic, message });
    setErrors(val);
    if (Object.keys(val).length > 0) return;

    setSubmittedRef(`TKT-${Math.floor(10000 + Math.random() * 90000)}`);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <section className="py-10 space-y-8 max-w-2xl">
      <div className="border-b border-[#EAE4E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
          Customer Care
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
          Contact Us &amp; Help Centre
        </h1>
        <p className="mt-1.5 text-sm text-[#6E5F66]">
          Reach our beauty advisors at <strong>help@kcrossindia.store</strong> (Mon–Sun, 10 AM – 8
          PM).
        </p>
      </div>

      {submittedRef && (
        <div
          role="status"
          className="rounded-xl border border-[#C6DFCB] bg-[#F3FAF5] p-4 text-sm text-[#1E462A]"
        >
          Message received. Support reference <strong className="font-mono-num">{submittedRef}</strong>{' '}
          — our care team will reply within 24 working hours.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-[#EAE4E0] bg-white p-6 space-y-4"
      >
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-[#1E161A] mb-1">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3.5 py-2.5 text-sm focus:border-[#C41E68] focus:outline-none"
          />
          {errors.name && <p className="mt-1 text-xs text-[#B91C1C]">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold text-[#1E161A] mb-1">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3.5 py-2.5 text-sm focus:border-[#C41E68] focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-[#B91C1C]">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="contact-topic" className="block text-xs font-semibold text-[#1E161A] mb-1">
              Topic
            </label>
            <select
              id="contact-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3.5 py-2.5 text-sm focus:border-[#C41E68] focus:outline-none"
            >
              <option>Order &amp; Shipping</option>
              <option>Returns &amp; Refunds</option>
              <option>Product &amp; Routine Advice</option>
              <option>Studio Appointment</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-xs font-semibold text-[#1E161A] mb-1">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Include your order ID or product question..."
            className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3.5 py-2.5 text-sm focus:border-[#C41E68] focus:outline-none"
          />
          {errors.message && <p className="mt-1 text-xs text-[#B91C1C]">{errors.message}</p>}
        </div>

        <button
          type="submit"
          className="rounded-lg bg-[#C41E68] px-6 py-3 text-sm font-semibold text-white hover:bg-[#A61757]"
        >
          Send Message
        </button>
      </form>
    </section>
  );
};

export const FaqView: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = [
    {
      q: 'Are all products sold on kcross india 100% authentic?',
      a: 'Yes. Every item is sourced directly from authorized brand houses and official Indian distributors—never grey-market resellers.',
    },
    {
      q: 'How does Cash on Delivery (COD) and free shipping work?',
      a: 'Orders of ₹999 or more qualify for free pan-India shipping. Below ₹999, a flat ₹99 delivery fee applies. You can pay via UPI, Card, or Cash on Delivery.',
    },
    {
      q: 'Can I redeem kcross india Gift Cards at physical stores?',
      a: 'Yes, digital and physical kcross india Gift Cards work seamlessly both online at checkout and across all flagship studios in Mumbai, Delhi, Bengaluru, and Hyderabad.',
    },
    {
      q: 'Are in-store beauty services really complimentary?',
      a: 'Skin & Barrier Analysis, Express Shade Matching, and Luxury Fragrance Layering are complimentary. Salon Bond Consultations carry a ₹499 fee that is 100% redeemable against any same-day product purchase.',
    },
  ];

  return (
    <section className="py-10 space-y-6 max-w-3xl">
      <div className="border-b border-[#EAE4E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">Help</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="space-y-3">
        {faqs.map((item, idx) => {
          const open = openIdx === idx;
          return (
            <div
              key={item.q}
              className="rounded-xl border border-[#EAE4E0] bg-white overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIdx(open ? null : idx)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-sm text-[#1E161A]"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-[#6E5F66] shrink-0 transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open && (
                <div className="px-5 pb-4 text-sm text-[#5C4F55] leading-relaxed border-t border-[#F3EFEC] pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const EditorialPolicyView: React.FC<{
  mode: 'returns' | 'shipping' | 'our-story' | 'ingredients';
}> = ({ mode }) => {
  const copy = {
    returns: {
      eyebrow: 'Policy',
      title: 'Returns & Cancellation Policy',
      paragraphs: [
        'Changed your mind or received a damaged parcel? Unopened, sealed products with original packaging can be returned within 30 days of delivery with complimentary doorstep pickup.',
        'Orders may be cancelled prior to dispatch from your Track Order view or by emailing help@kcrossindia.store.',
      ],
      bullets: [
        'Unopened skincare, haircare, fragrance & sealed appliances eligible within 30 days.',
        'Refunds process to original UPI/Card within 5–7 business days (bank transfer for COD).',
        'For hygiene safety, opened makeup, unsealed fragrances, and used serums cannot be returned unless defective.',
      ],
    },
    shipping: {
      eyebrow: 'Policy',
      title: 'Pan-India Shipping',
      paragraphs: [
        'All orders placed before 3:00 PM IST are packed in temperature-safe cushioning and dispatched within one business day from our Mumbai & Delhi fulfillment hubs.',
      ],
      bullets: [
        'Metro cities (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Pune, Chennai): 2–3 business days.',
        'Rest of India: 4–7 business days via insured courier partners.',
        'Free shipping on all orders over ₹999; flat ₹99 fee below ₹999.',
      ],
    },
    'our-story': {
      eyebrow: 'Company',
      title: 'Our Story',
      paragraphs: [
        'kcross india brings together over two decades of Indian beauty retail heritage with kcrossindia.store’s everyday minimalist routine philosophy.',
        'From French pharmacy micellar staples and patented hair bond science to luxury millésime perfumery and complimentary in-store shade trials, we make authentic beauty effortless.',
      ],
      bullets: [
        'Direct partnerships with global luxury, K-beauty, derm, and Indian artist brands.',
        '5 physical retail studios offering complimentary consultations.',
        'Transparent pricing, batch verification, and responsive human care.',
      ],
    },
    ingredients: {
      eyebrow: 'Standards',
      title: 'Ingredient Transparency',
      paragraphs: [
        'Every product card and detail module highlights key actives alongside full usage guidance so you can build routines without guesswork.',
      ],
      bullets: [
        'Full key-active disclosure across derm cleansers, essences, and hair bond treatments.',
        'Dedicated sensitive-skin and fragrance-free options (CeraVe, Cetaphil, Bioderma, Lumé).',
        'Cruelty-free standards prioritized across our curated house edits.',
      ],
    },
  }[mode];

  return (
    <section className="py-10 space-y-6 max-w-3xl">
      <div className="border-b border-[#EAE4E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
          {copy.title}
        </h1>
      </div>

      <div className="space-y-4 text-sm text-[#4A3F45] leading-relaxed">
        {copy.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <ul className="space-y-2.5 pt-2">
          {copy.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-[#1E161A]">
              <Check className="h-4 w-4 text-[#C41E68] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
