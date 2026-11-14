import React, { useState } from 'react';
import { Check, Copy, Gift, Tag } from 'lucide-react';
import { OFFERS, PRODUCTS } from '../data/catalog';
import { Product } from '../types/store';
import { formatINR, validateEmail } from '../utils/storeLogic';
import { ProductArt } from './ProductArt';
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
      <div className="border-b border-[#EAE4E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
          Weekly Markdowns &amp; Promo Codes
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
          Active Offers &amp; Deals
        </h1>
        <p className="mt-1.5 text-sm text-[#6E5F66]">
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
              className="flex flex-col justify-between rounded-xl border border-[#EAE4E0] bg-white p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-mono-num text-xs font-semibold text-[#C41E68]">
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    {offer.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(offer.code)}
                    className="inline-flex items-center gap-1 text-xs text-[#6E5F66] hover:text-[#1E161A]"
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
                <h2 className="mt-3 font-display text-xl font-medium text-[#1E161A]">
                  {offer.title}
                </h2>
                <p className="mt-1.5 text-sm text-[#5C4F55]">{offer.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F3EFEC] flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#6E5F66]">{offer.validNote}</span>
                <button
                  type="button"
                  onClick={() => onApplyCouponAndOpenBag(offer.code)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                    isApplied
                      ? 'bg-[#1E161A] text-white'
                      : 'bg-[#C41E68] text-white hover:bg-[#A61757]'
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
        <h2 className="font-display text-2xl font-medium text-[#1E161A]">
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

interface GiftCardsViewProps {
  onAddGiftCardToBag: (amount: number, recipientEmail: string, message: string) => void;
}

const DENOMINATIONS = [500, 1000, 2500, 5000];

export const GiftCardsView: React.FC<GiftCardsViewProps> = ({ onAddGiftCardToBag }) => {
  const [amount, setAmount] = useState<number>(2500);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(recipientEmail)) {
      setError('Enter a valid recipient email address.');
      return;
    }
    setError(null);
    onAddGiftCardToBag(amount, recipientEmail.trim(), message.trim());
    setRecipientEmail('');
    setMessage('');
  };

  return (
    <section className="py-10 space-y-8">
      <div className="border-b border-[#EAE4E0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
          Instant Digital &amp; Studio Redemption
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
          kcross india Gift Cards
        </h1>
        <p className="mt-1.5 text-sm text-[#6E5F66] max-w-[60ch]">
          Redeemable across all online products and in-store studio services with zero expiry fees
          for 12 months.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 rounded-2xl border border-[#EAE4E0] bg-white p-6">
          <ProductArt
            form="giftcard"
            brand="kcross india"
            surfaceTone="#F6ECEF"
            accentTone="#C41E68"
            className="aspect-[4/3] w-full rounded-xl"
          />
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="font-semibold text-[#1E161A]">Selected Value</span>
            <span className="font-mono-num text-lg font-bold text-[#C41E68]">
              {formatINR(amount)}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6E5F66]">
            Delivered digitally via email immediately upon order confirmation. Zero shipping fee.
          </p>
        </div>

        <form
          onSubmit={handleAdd}
          noValidate
          className="lg:col-span-7 rounded-2xl border border-[#EAE4E0] bg-white p-6 md:p-8 space-y-5"
        >
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#6E5F66] mb-2">
              1. Choose Denomination
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DENOMINATIONS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`rounded-lg border py-3 text-sm font-semibold tabular-nums transition-colors ${
                    amount === val
                      ? 'border-[#C41E68] bg-[#C41E68]/10 text-[#C41E68]'
                      : 'border-[#EAE4E0] bg-[#FAF8F6] text-[#1E161A] hover:border-[#1E161A]'
                  }`}
                >
                  {formatINR(val)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="gift-recipient" className="block text-xs font-semibold text-[#1E161A] mb-1">
              2. Recipient Email Address
            </label>
            <input
              id="gift-recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3.5 py-2.5 text-sm text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-[#B91C1C]">{error}</p>}
          </div>

          <div>
            <label htmlFor="gift-note" className="block text-xs font-semibold text-[#1E161A] mb-1">
              3. Personal Note (Optional)
            </label>
            <textarea
              id="gift-note"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Wishing you a radiant birthday..."
              className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3.5 py-2.5 text-sm text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C41E68] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A61757]"
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
            <span>Add Gift Card to Bag · {formatINR(amount)}</span>
          </button>
        </form>
      </div>
    </section>
  );
};
