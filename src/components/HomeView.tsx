import React, { useState } from 'react';
import { ArrowRight, Calendar, MapPin, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { CATEGORIES, PRODUCTS, SERVICES, STORES } from '../data/catalog';
import { ActiveView, CategoryId, Product } from '../types/store';
import { validateEmail } from '../utils/storeLogic';
import { ProductArt } from './ProductArt';
import { ProductCard } from './ProductCard';

interface HomeViewProps {
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigateCategory: (category: CategoryId, dealOnly?: boolean) => void;
  onNavigateView: (view: ActiveView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  wishlistIds,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
  onNavigateCategory,
  onNavigateView,
}) => {
  const [featuredTab, setFeaturedTab] = useState<'deals' | 'bestsellers' | 'luxury'>('deals');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  const heroProducts = [
    PRODUCTS.find((p) => p.id === 'bf-2')!, // OLAPLEX No. 4
    PRODUCTS.find((p) => p.id === 'bf-1')!, // Davidoff Cool Water
    PRODUCTS.find((p) => p.id === 'bf-9')!, // CeraVe Cream
    PRODUCTS.find((p) => p.id === 'bf-18')!, // Charlotte Tilbury Pillow Talk
  ];

  const featuredProducts = PRODUCTS.filter((p) => {
    if (featuredTab === 'deals') return p.tag === 'Weekly Deal';
    if (featuredTab === 'bestsellers') return p.tag === 'Bestseller';
    return p.tag === 'Luxury';
  }).slice(0, 6);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(newsletterEmail)) {
      setNewsletterStatus({ ok: false, text: 'Please enter a valid email address.' });
      return;
    }
    setNewsletterStatus({
      ok: true,
      text: 'Welcome to kcross india store. Use code GLOW15 at checkout for 15% off your first order.',
    });
    setNewsletterEmail('');
  };

  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-16 pb-12 sm:pb-16">
      {/* Section 1: Storefront Hero */}
      <section className="pt-6 sm:pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C2410C]">
              India’s Curated Beauty Destination
            </p>
            <h1 className="mt-2.5 sm:mt-3 font-display text-3xl sm:text-4xl lg:text-[2.85rem] xl:text-[3.1rem] font-bold leading-[1.1] text-[#1C1613]">
              Authentic beauty, salon haircare &amp; studio services.
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#574B44] max-w-[52ch] leading-relaxed">
              Shop 100% brand-sourced skincare, luxury fragrances, salon tools, and mom &amp; baby
              essentials—or book a complimentary shade match and barrier analysis at our flagship
              studios.
            </p>

            <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateCategory('all', true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C2410C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] whitespace-nowrap"
              >
                <span>Shop Weekly Deals</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('services')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D8CEC4] bg-white px-5 py-3.5 text-sm font-semibold text-[#1C1613] transition-colors hover:border-[#1C1613] whitespace-nowrap"
              >
                <Calendar className="h-4 w-4 text-[#C2410C]" aria-hidden="true" />
                <span>Book Studio Service</span>
              </button>
            </div>

            <div className="mt-7 sm:mt-8 pt-5 sm:pt-6 border-t border-[#EAE1D8] grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
              <div>
                <span className="block font-semibold text-[#1C1613]">100% Authentic</span>
                <span className="text-[#6E6058]">Direct from brand partners</span>
              </div>
              <div>
                <span className="block font-semibold text-[#1C1613]">Pan-India Delivery</span>
                <span className="text-[#6E6058]">Free over ₹999 · COD ready</span>
              </div>
              <div>
                <span className="block font-semibold text-[#1C1613]">5 Flagship Studios</span>
                <span className="text-[#6E6058]">Mumbai · Delhi · Bengaluru</span>
              </div>
            </div>
          </div>

          {/* Right Hero Showcase Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-3 sm:gap-4">
            {heroProducts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectProduct(item)}
                className="group flex flex-col justify-between rounded-xl border border-[#EAE1D8] bg-white p-2.5 sm:p-3.5 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]"
              >
                <ProductArt
                  form={item.visualForm}
                  brand={item.brand}
                  surfaceTone={item.surfaceTone}
                  accentTone={item.accentTone}
                  imageUrl={item.imageUrl}
                  imageAlt={`${item.brand} ${item.name}`}
                  className="aspect-[4/3] w-full rounded-lg"
                />
                <div className="mt-2.5 sm:mt-3 min-w-0">
                  <span className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#6E6058] truncate">
                    {item.brand}
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold text-[#1C1613] truncate group-hover:text-[#C2410C]">
                    {item.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Shop by Category (All 7 storefront departments) */}
      <section aria-labelledby="categories-heading" className="border-t border-[#EAE1D8] pt-10 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div>
            <h2
              id="categories-heading"
              className="font-display text-2xl sm:text-3xl font-medium text-[#1C1613]"
            >
              Shop by department
            </h2>
            <p className="mt-1 text-sm text-[#6E6058]">
              Explore every category across skincare, makeup, salon hair, luxury scent &amp; tools.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateCategory('all', false)}
            className="text-sm font-semibold text-[#C2410C] hover:underline whitespace-nowrap"
          >
            View full catalog ({PRODUCTS.length} items) →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigateCategory(cat.id, false)}
              className="group flex flex-col justify-between rounded-xl border border-[#EAE1D8] bg-white p-3.5 sm:p-4 text-left transition-all hover:border-[#C2410C] hover:-translate-y-0.5"
            >
              <span
                className="h-2.5 w-8 rounded-sm mb-4 sm:mb-5"
                style={{ backgroundColor: cat.accentTone }}
                aria-hidden="true"
              />
              <div>
                <span className="block text-sm font-semibold text-[#1C1613] group-hover:text-[#C2410C]">
                  {cat.label}
                </span>
                <span className="mt-1 block text-[11px] text-[#6E6058] line-clamp-2">
                  {cat.subCategories.slice(0, 2).join(' · ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Featured Product Grid */}
      <section aria-labelledby="featured-heading" className="border-t border-[#EAE1D8] pt-10 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <h2
              id="featured-heading"
              className="font-display text-2xl sm:text-3xl font-medium text-[#1C1613]"
            >
              Curated edits
            </h2>
            <p className="mt-1 text-sm text-[#6E6058]">
              Weekly markdowns, dermatologist staples, and luxury prestige icons.
            </p>
          </div>

          <div className="inline-flex w-full sm:w-auto items-center gap-1 rounded-lg bg-[#F3ECE4] p-1">
            {(
              [
                ['deals', 'Weekly Deals'],
                ['bestsellers', 'Must-Haves'],
                ['luxury', 'Luxury Edit'],
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setFeaturedTab(tabKey)}
                className={`flex-1 sm:flex-none text-center rounded-md px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  featuredTab === tabKey
                    ? 'bg-white text-[#1C1613] shadow-xs'
                    : 'text-[#6E6058] hover:text-[#1C1613]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {featuredProducts.map((product) => (
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
      </section>

      {/* Section 4: Studio Services + Newsletter */}
      <section className="border-t border-[#EAE1D8] pt-10 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* In-Store Services Showcase */}
          <div className="lg:col-span-7 rounded-2xl border border-[#EAE1D8] bg-white p-5 sm:p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>In-Store Beauty Services</span>
              </div>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-[#1C1613]">
                Experience personal skin, hair &amp; fragrance consultations.
              </h2>
              <p className="mt-2 text-sm text-[#574B44] max-w-[58ch]">
                Visit our {STORES.length} retail studios across Mumbai, New Delhi, Bengaluru, and
                Hyderabad for shade mapping, scalp scans, and bespoke scent layering.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SERVICES.map((svc) => (
                  <div
                    key={svc.id}
                    className="border-t border-[#EAE1D8] pt-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-[#6E6058]">
                      <span>{svc.category} · {svc.duration}</span>
                      <span className="font-semibold text-[#1C1613]">{svc.priceLabel}</span>
                    </div>
                    <h3 className="mt-1 font-sans text-sm font-semibold text-[#1C1613]">
                      {svc.name}
                    </h3>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#EAE1D8] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-2 text-xs text-[#6E6058]">
                <MapPin className="h-4 w-4 text-[#C2410C] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                <span>Bandra West · Lower Parel · Khan Market · Indiranagar · Jubilee Hills</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateView('services')}
                className="w-full sm:w-auto rounded-lg bg-[#1C1613] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#332924] whitespace-nowrap"
              >
                Reserve Appointment
              </button>
            </div>
          </div>

          {/* Newsletter & Gift Card Block */}
          <div className="lg:col-span-5 rounded-2xl bg-[#1C1613] text-[#FCF9F5] p-5 sm:p-6 md:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FB923C]">
                First Order Offer
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium">
                Get 15% off with code GLOW15
              </h2>
              <p className="mt-2 text-sm text-[#DDD3CC]">
                Join for new international brand drops, weekly markdown alerts, and studio event
                invitations.
              </p>

              <form onSubmit={handleNewsletterSubmit} noValidate className="mt-5 space-y-3">
                <label className="block">
                  <span className="sr-only">Email address</span>
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/20 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-[#FB923C] focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#C2410C] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412]"
                >
                  Subscribe &amp; Unlock Offer
                </button>
                {newsletterStatus && (
                  <p
                    role="status"
                    className={`text-xs ${
                      newsletterStatus.ok ? 'text-[#FDBA74]' : 'text-[#FCA5A5]'
                    }`}
                  >
                    {newsletterStatus.text}
                  </p>
                )}
              </form>
            </div>

            <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#DDD3CC]">
                <Truck className="h-4 w-4 text-[#FB923C] shrink-0" aria-hidden="true" />
                <span>Gifting someone special?</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateView('gift-cards')}
                className="font-semibold text-[#FDBA74] hover:underline whitespace-nowrap"
              >
                Send a Gift Card →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
