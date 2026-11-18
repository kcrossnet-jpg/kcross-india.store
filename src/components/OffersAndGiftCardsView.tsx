import React, { useState } from 'react';
import { Check, Copy, Gift, Mail, ShieldCheck, Sparkles, Store, Tag } from 'lucide-react';
import { OFFERS, PRODUCTS } from '../data/catalog';
import { Product } from '../types/store';
import { formatINR, validateEmail } from '../utils/storeLogic';
import { ProductCard } from './ProductCard';

interface OffersViewProps {
  activeCoupon: string | null;
  wishlistIds: string[];
  onApplyCouponAndOpenBag: (code: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

export const OffersView: React.FC<OffersViewProps> = ({
  activeCoupon,
  wishlistIds,
  onApplyCouponAndOpenBag,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const weeklyDealProducts = PRODUCTS.filter((p) => p.tag === 'Weekly Deal' || p.mrp);

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section className="py-10 space-y-12">
      <div className="border-b border-[#EAE1D8] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
          Weekly Markdowns &amp; Promo Codes
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1C1613]">
          Active Offers &amp; Deals
        </h1>
        <p className="mt-1.5 text-sm text-[#6E6058]">
          Apply a code straight to your shopping bag or explore this week’s brand-direct markdowns.
        </p>
      </div>

      {/* Promo Codes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {OFFERS.map((offer) => {
          const isApplied = activeCoupon === offer.code;
          return (
            <div
              key={offer.code}
              className="flex flex-col justify-between rounded-xl border border-[#EAE1D8] bg-white p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono-num text-xs font-semibold text-[#C2410C]">
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    {offer.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(offer.code)}
                    className="inline-flex items-center gap-1 text-xs text-[#6E6058] hover:text-[#1C1613]"
                    aria-label={`Copy coupon code ${offer.code}`}
                  >
                    {copiedCode === offer.code ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#2E6F40]" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <h2 className="mt-3 font-display text-xl font-medium text-[#1C1613]">
                  {offer.title}
                </h2>
                <p className="mt-1.5 text-sm text-[#574B44]">{offer.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F3ECE4] flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#6E6058]">{offer.validNote}</span>
                <button
                  type="button"
                  onClick={() => onApplyCouponAndOpenBag(offer.code)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                    isApplied
                      ? 'bg-[#1C1613] text-white'
                      : 'bg-[#C2410C] text-white hover:bg-[#9A3412]'
                  }`}
                >
                  {isApplied ? 'Applied in Bag' : 'Apply Code'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Discounted Products Grid */}
      <div className="space-y-5">
        <h2 className="font-display text-2xl font-medium text-[#1C1613]">
          On Sale This Week ({weeklyDealProducts.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {weeklyDealProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.includes(product.id)}
              onSelect={onSelectProduct}
              onQuickAdd={onQuickAdd}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export interface GiftCardStyleSelection {
  editionLabel: string;
  surfaceTone: string;
  accentTone: string;
}

interface GiftCardsViewProps {
  onAddGiftCardToBag: (
    amount: number,
    recipientEmail: string,
    message: string,
    cardStyle?: GiftCardStyleSelection
  ) => void;
}

interface GiftCardEdition {
  id: 'espresso' | 'saffron' | 'ivory';
  label: string;
  subtitle: string;
  surfaceTone: string;
  accentTone: string;
  cardClass: string;
  eyebrowClass: string;
  subtextClass: string;
  dividerClass: string;
  swatchClass: string;
}

const GIFT_EDITIONS: GiftCardEdition[] = [
  {
    id: 'espresso',
    label: 'Espresso Signature',
    subtitle: 'Matte charcoal · Warm tangerine foil',
    surfaceTone: '#FFF3EB',
    accentTone: '#C2410C',
    cardClass:
      'bg-gradient-to-br from-[#1C1613] via-[#2B201B] to-[#1C1613] text-[#FCF9F5] border-[#FDBA74]/35',
    eyebrowClass: 'text-[#FDBA74]',
    subtextClass: 'text-[#DDD3CC]',
    dividerClass: 'border-white/15',
    swatchClass: 'bg-[#1C1613] border-[#FDBA74]',
  },
  {
    id: 'saffron',
    label: 'Saffron Studio',
    subtitle: 'Vibrant orange · Crisp ivory typography',
    surfaceTone: '#FFF3EB',
    accentTone: '#9A3412',
    cardClass:
      'bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#9A3412] text-white border-[#FDBA74]/50',
    eyebrowClass: 'text-[#FFF3EB]',
    subtextClass: 'text-[#FFE7D6]',
    dividerClass: 'border-white/20',
    swatchClass: 'bg-[#C2410C] border-[#9A3412]',
  },
  {
    id: 'ivory',
    label: 'Warm Ivory Edition',
    subtitle: 'Cotton linen · Espresso ink detail',
    surfaceTone: '#FCF9F5',
    accentTone: '#C2410C',
    cardClass:
      'bg-gradient-to-br from-[#FCF9F5] via-[#FFFFFF] to-[#F5EFE8] text-[#1C1613] border-[#D8CEC4]',
    eyebrowClass: 'text-[#C2410C]',
    subtextClass: 'text-[#574B44]',
    dividerClass: 'border-[#EAE1D8]',
    swatchClass: 'bg-[#FCF9F5] border-[#D8CEC4]',
  },
];

const DENOMINATIONS = [500, 1000, 2500, 5000, 10000];

const OCCASION_PRESETS = [
  {
    label: 'Birthday',
    text: 'Happy Birthday! Treat yourself to your favorite skincare, scents, or a studio consultation at kcross india store.',
  },
  {
    label: 'Festive',
    text: 'Warm festive wishes — enjoy something radiant from kcross india store.',
  },
  {
    label: 'Thank You',
    text: 'Thank you for everything. Pick out what you love from our curated beauty collection.',
  },
];

export const GiftCardsView: React.FC<GiftCardsViewProps> = ({ onAddGiftCardToBag }) => {
  const [editionId, setEditionId] = useState<GiftCardEdition['id']>('espresso');
  const [amount, setAmount] = useState<number>(2500);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const selectedEdition =
    GIFT_EDITIONS.find((ed) => ed.id === editionId) ?? GIFT_EDITIONS[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(recipientEmail)) {
      setError('Enter a valid recipient email address.');
      return;
    }
    setError(null);
    onAddGiftCardToBag(amount, recipientEmail.trim(), message.trim(), {
      editionLabel: selectedEdition.label,
      surfaceTone: selectedEdition.surfaceTone,
      accentTone: selectedEdition.accentTone,
    });
    setRecipientEmail('');
    setMessage('');
  };

  return (
    <section className="py-6 sm:py-8 space-y-7">
      {/* Editorial Header */}
      <div className="border-b border-[#EAE1D8] pb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Kcross india Digital &amp; Studio E-Gift</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#1C1613]">
            kcross india store Gift Cards
          </h1>
          <p className="text-sm text-[#6E6058] max-w-[60ch]">
            Send instant beauty credit redeemable online at kcrossindia.store and across all 5
            flagship retail studios with zero expiry fees for 12 months.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-[#EAE1D8] bg-white px-3.5 py-2">
          <img
            src="/assets/aistudio/imgi_5_images_e8c25121.jpg"
            alt="Kcross india official seal"
            width={36}
            height={36}
            className="h-9 w-9 rounded-md object-contain bg-white border border-[#EAE1D8] shrink-0"
          />
          <div className="text-xs leading-tight">
            <span className="block font-semibold text-[#1C1613]">Official Brand E-Gift</span>
            <span className="text-[#6E6058]">Delivered instantly · Zero shipping fee</span>
          </div>
        </div>
      </div>

      {/* Main Split Studio: Live Card Showcase + Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left: Live Physical-Ratio Gift Card Showcase */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[#EAE1D8] bg-[#F5EFE8]/70 p-4 sm:p-5">
            {/* Interactive Physical-Ratio Card */}
            <div
              className={`relative aspect-[1.6/1] w-full rounded-2xl border p-5 sm:p-6 flex flex-col justify-between shadow-xl transition-colors duration-200 overflow-hidden ${selectedEdition.cardClass}`}
            >
              {/* Subtle top-right watermark texture */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#FB923C]/15 blur-2xl"
              />

              {/* Top Row: Kcross india Brand Logo + Edition Label */}
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white p-1 shadow-sm border border-[#EAE1D8] shrink-0 flex items-center justify-center">
                    <img
                      src="/assets/aistudio/imgi_5_images_e8c25121.jpg"
                      alt="Kcross india logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`block text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest ${selectedEdition.eyebrowClass}`}
                    >
                      Official E-Gift Card
                    </span>
                    <span className="block font-display text-lg sm:text-xl font-semibold tracking-tight truncate">
                      kcross india store
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`block text-[10px] uppercase tracking-wider ${selectedEdition.subtextClass}`}
                  >
                    Value
                  </span>
                  <span className="font-mono-num text-xl sm:text-2xl font-bold tracking-tight tabular-nums">
                    {formatINR(amount)}
                  </span>
                </div>
              </div>

              {/* Middle Preview Note */}
              <div className="relative my-auto py-2">
                {message.trim() ? (
                  <p className={`text-xs sm:text-sm italic line-clamp-2 ${selectedEdition.subtextClass}`}>
                    “{message.trim()}”
                  </p>
                ) : (
                  <p className={`text-xs sm:text-sm ${selectedEdition.subtextClass}`}>
                    Skincare, luxury fragrances, salon haircare &amp; studio services across India.
                  </p>
                )}
              </div>

              {/* Bottom Strip: Recipient & Redemption Badge */}
              <div
                className={`relative pt-3 border-t flex items-end justify-between gap-3 text-xs ${selectedEdition.dividerClass}`}
              >
                <div className="min-w-0">
                  <span className={`block text-[10px] uppercase tracking-wider ${selectedEdition.subtextClass}`}>
                    Recipient
                  </span>
                  <span className="block font-medium truncate">
                    {recipientEmail.trim() || 'recipient@example.com'}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className={`block text-[10px] font-mono-num uppercase tracking-wider ${selectedEdition.eyebrowClass}`}>
                    {selectedEdition.label}
                  </span>
                  <span className={`text-[10px] ${selectedEdition.subtextClass}`}>
                    Valid 12 Months
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl border border-[#EAE1D8] bg-white p-3 flex sm:block items-center gap-3">
                <Mail className="h-4 w-4 text-[#C2410C] sm:mb-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#1C1613]">Instant Email</p>
                  <p className="text-[11px] text-[#6E6058]">Sent after checkout</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#EAE1D8] bg-white p-3 flex sm:block items-center gap-3">
                <Store className="h-4 w-4 text-[#C2410C] sm:mb-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#1C1613]">5 Studios + Web</p>
                  <p className="text-[11px] text-[#6E6058]">Redeem anywhere</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#EAE1D8] bg-white p-3 flex sm:block items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#C2410C] sm:mb-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-[#1C1613]">No Extra Fees</p>
                  <p className="text-[11px] text-[#6E6058]">Zero shipping cost</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Structured Configurator Form */}
        <form
          onSubmit={handleAdd}
          noValidate
          className="lg:col-span-6 rounded-2xl border border-[#EAE1D8] bg-white p-5 sm:p-6 space-y-4"
        >
          {/* Step 1: Card Edition */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#6E6058] mb-2">
              1. Select Card Edition
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {GIFT_EDITIONS.map((ed) => {
                const active = editionId === ed.id;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => setEditionId(ed.id)}
                    aria-pressed={active}
                    className={`rounded-xl border p-2.5 text-left transition-colors ${
                      active
                        ? 'border-[#C2410C] bg-[#FFF3EB]/70'
                        : 'border-[#EAE1D8] bg-[#FCF9F5] hover:border-[#1C1613]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`h-3.5 w-5 rounded border ${ed.swatchClass}`}
                        aria-hidden="true"
                      />
                      {active && <Check className="h-3.5 w-3.5 text-[#C2410C]" aria-hidden="true" />}
                    </div>
                    <span className="block text-xs font-semibold text-[#1C1613] leading-snug">
                      {ed.label}
                    </span>
                    <span className="block text-[11px] text-[#6E6058] mt-0.5 leading-tight">
                      {ed.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Denomination */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#6E6058] mb-2">
              2. Choose Denomination
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {DENOMINATIONS.map((val) => {
                const active = amount === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    aria-pressed={active}
                    className={`rounded-lg border py-2 px-2 text-xs sm:text-sm font-semibold tabular-nums transition-colors ${
                      active
                        ? 'border-[#C2410C] bg-[#C2410C] text-white'
                        : 'border-[#EAE1D8] bg-[#FCF9F5] text-[#1C1613] hover:border-[#1C1613]'
                    }`}
                  >
                    {formatINR(val)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Recipient Email */}
          <div>
            <label htmlFor="gift-recipient" className="block text-xs font-semibold uppercase tracking-wider text-[#6E6058] mb-1.5">
              3. Recipient Email Address
            </label>
            <input
              id="gift-recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => {
                setRecipientEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="friend@example.com"
              className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3.5 py-2 text-sm text-[#1C1613] placeholder:text-[#8A7B72] focus:border-[#C2410C] focus:outline-none"
            />
            {error && <p className="mt-1 text-xs font-medium text-[#B91C1C]">{error}</p>}
          </div>

          {/* Step 4: Occasion & Message */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="gift-note" className="block text-xs font-semibold uppercase tracking-wider text-[#6E6058]">
                4. Personal Greeting (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OCCASION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setMessage(preset.text)}
                    className="rounded-md border border-[#EAE1D8] bg-[#FCF9F5] px-2.5 py-1 text-[11px] font-medium text-[#574B44] hover:border-[#C2410C] hover:text-[#C2410C] transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              id="gift-note"
              rows={2}
              maxLength={220}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a birthday note, festive greeting, or shade recommendation..."
              className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3.5 py-2 text-sm text-[#1C1613] placeholder:text-[#8A7B72] focus:border-[#C2410C] focus:outline-none"
            />
            <p className="text-[11px] text-[#6E6058] text-right tabular-nums">
              {message.length}/220 characters
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-[#F3ECE4] space-y-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#C2410C] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412]"
            >
              <Gift className="h-4 w-4" aria-hidden="true" />
              <span>
                Add {selectedEdition.label} · {formatINR(amount)} to Bag
              </span>
            </button>
            <p className="text-[11px] text-[#6E6058] text-center">
              Gift cards ship free digitally and appear immediately in your bag for checkout.
            </p>
          </div>
        </form>
      </div>

      {/* Bottom 3-Step Redemption Guide */}
      <div className="rounded-2xl border border-[#EAE1D8] bg-white p-5 sm:p-7 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <span className="font-mono-num text-xs font-semibold text-[#C2410C]">01</span>
          <h2 className="mt-1 font-display text-lg font-medium text-[#1C1613]">
            Customize &amp; Checkout
          </h2>
          <p className="mt-1 text-xs text-[#6E6058] leading-relaxed">
            Pick a card finish bearing the Kcross india mark, select your denomination from ₹500 to
            ₹10,000, and complete checkout via UPI or Card.
          </p>
        </div>
        <div className="md:border-l md:border-[#F3ECE4] md:pl-6">
          <span className="font-mono-num text-xs font-semibold text-[#C2410C]">02</span>
          <h2 className="mt-1 font-display text-lg font-medium text-[#1C1613]">
            Instant Digital Code
          </h2>
          <p className="mt-1 text-xs text-[#6E6058] leading-relaxed">
            Your recipient receives the digital card code directly by email with your greeting note,
            ready to redeem immediately.
          </p>
        </div>
        <div className="md:border-l md:border-[#F3ECE4] md:pl-6">
          <span className="font-mono-num text-xs font-semibold text-[#C2410C]">03</span>
          <h2 className="mt-1 font-display text-lg font-medium text-[#1C1613]">
            Redeem Online or In-Studio
          </h2>
          <p className="mt-1 text-xs text-[#6E6058] leading-relaxed">
            Valid across all brands at kcrossindia.store as well as consultations and treatments at
            Mumbai, Delhi, Bengaluru &amp; Hyderabad studios.
          </p>
        </div>
      </div>
    </section>
  );
};
