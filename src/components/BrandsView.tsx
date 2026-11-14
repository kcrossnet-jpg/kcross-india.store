import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { BRANDS, PRODUCTS } from '../data/catalog';
import { BrandInfo } from '../types/store';

interface BrandsViewProps {
  onSelectBrand: (brandName: string) => void;
}

export const BrandsView: React.FC<BrandsViewProps> = ({ onSelectBrand }) => {
  const [tier, setTier] = useState<'All' | BrandInfo['tier']>('All');

  const tiers: Array<'All' | BrandInfo['tier']> = [
    'All',
    'Luxury',
    'Derm Skincare',
    'Salon Pro',
    'Everyday Beauty',
  ];

  const filtered = tier === 'All' ? BRANDS : BRANDS.filter((b) => b.tier === tier);

  return (
    <section className="py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EAE4E0] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
            Authorized Retail Partners
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
            Curated Global &amp; Indian Brands
          </h1>
          <p className="mt-1.5 text-sm text-[#6E5F66] max-w-[60ch]">
            Every fragrance, bond-building hair formula, and dermatologist staple is sourced
            directly from authorized brand houses with batch traceability.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#EFEBE8] p-1 rounded-lg">
          {tiers.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                tier === t
                  ? 'bg-white text-[#1E161A] shadow-xs'
                  : 'text-[#6E5F66] hover:text-[#1E161A]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((brand) => {
          const count = PRODUCTS.filter(
            (p) => p.brand.toLowerCase() === brand.name.toLowerCase()
          ).length;

          return (
            <div
              key={brand.id}
              className="flex flex-col justify-between rounded-xl border border-[#EAE4E0] bg-white p-5 transition-colors hover:border-[#C41E68]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#6E5F66]">
                  <span>{brand.tier}</span>
                  <span aria-hidden="true">·</span>
                  <span>{brand.origin}</span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-medium text-[#1E161A]">
                  {brand.name}
                </h2>
                <p className="mt-2 text-sm text-[#5C4F55] leading-relaxed">
                  {brand.specialty}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F3EFEC] flex items-center justify-between gap-3">
                <span className="text-xs text-[#6E5F66] truncate">
                  Signature: <strong className="text-[#1E161A]">{brand.highlight}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectBrand(brand.name)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#C41E68] hover:underline whitespace-nowrap shrink-0"
                >
                  <span>{count > 0 ? `Shop (${count})` : 'Browse'}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
