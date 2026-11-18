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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EAE1D8] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            Authorized Retail Partners
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1C1613]">
            Curated Global &amp; Indian Brands
          </h1>
          <p className="mt-1.5 text-sm text-[#6E6058] max-w-[60ch]">
            Every fragrance, bond-building hair formula, and dermatologist staple is sourced
            directly from authorized brand houses with batch traceability.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#F3ECE4] p-1 rounded-lg">
          {tiers.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                tier === t
                  ? 'bg-white text-[#1C1613] shadow-xs'
                  : 'text-[#6E6058] hover:text-[#1C1613]'
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
              className="flex flex-col justify-between rounded-xl border border-[#EAE1D8] bg-white p-5 transition-colors hover:border-[#C2410C]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#6E6058]">
                  <span>{brand.tier}</span>
                  <span aria-hidden="true">·</span>
                  <span>{brand.origin}</span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-medium text-[#1C1613]">
                  {brand.name}
                </h2>
                <p className="mt-2 text-sm text-[#574B44] leading-relaxed">
                  {brand.specialty}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F5EFE8] flex items-center justify-between gap-3">
                <span className="text-xs text-[#6E6058] truncate">
                  Signature: <strong className="text-[#1C1613]">{brand.highlight}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectBrand(brand.name)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#C2410C] hover:underline whitespace-nowrap shrink-0"
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
