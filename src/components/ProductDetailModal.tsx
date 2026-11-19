import React, { useEffect, useState } from 'react';
import { Check, Heart, ShieldCheck, Star, X } from 'lucide-react';
import { Product } from '../types/store';
import { formatINR, getDiscountPercent } from '../utils/storeLogic';
import { ProductArt } from './ProductArt';

interface ProductDetailModalProps {
  product: Product | null;
  isWishlisted: boolean;
  onClose: () => void;
  onAddToBag: (product: Product, variantIndex: number, quantity: number) => void;
  onToggleWishlist: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isWishlisted,
  onClose,
  onAddToBag,
  onToggleWishlist,
}) => {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'usage'>('overview');

  useEffect(() => {
    setSelectedVariantIdx(0);
    setQuantity(1);
    setActiveTab('overview');
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const variant = product.variants[selectedVariantIdx] ?? product.variants[0];
  const discount = getDiscountPercent(variant.price, variant.mrp);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C1613]/50 p-0 sm:p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl bg-[#FCF9F5] border border-[#EAE1D8] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="sticky sm:absolute top-3 sm:top-4 right-3 sm:right-4 float-right sm:float-none mt-3 mr-3 sm:mt-0 sm:mr-0 z-10 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white border border-[#EAE1D8] text-[#1C1613] hover:bg-[#F3ECE4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 clear-both">
          {/* Left Studio Gallery */}
          <div className="md:col-span-5 bg-white p-5 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#EAE1D8]">
            <ProductArt
              form={product.visualForm}
              brand={product.brand}
              surfaceTone={product.surfaceTone}
              accentTone={product.accentTone}
              imageUrl={product.imageUrl}
              imageAlt={`${product.brand} ${product.name}`}
              className="aspect-[4/3] sm:aspect-square w-full rounded-xl"
            />
            <div className="mt-4 flex items-center gap-2 text-xs text-[#6E6058]">
              <ShieldCheck className="h-4 w-4 text-[#C2410C] shrink-0" aria-hidden="true" />
              <span>100% Authentic · Sourced directly from {product.brand}</span>
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="md:col-span-7 p-5 sm:p-6 md:p-8 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6058]">
              <span className="font-semibold text-[#1C1613] uppercase tracking-wider">
                {product.brand}
              </span>
              <span aria-hidden="true">·</span>
              <span>{product.subCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums text-[#1C1613]">
                <Star className="h-3.5 w-3.5 fill-[#C2410C] text-[#C2410C]" aria-hidden="true" />
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            <h2
              id="pdp-title"
              className="mt-2 font-display text-2xl md:text-3xl font-medium text-[#1C1613] leading-tight"
            >
              {product.name}
            </h2>
            <p className="mt-1 text-sm text-[#6E6058]">{product.subtitle}</p>

            {/* Price row */}
            <div className="mt-5 flex items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-bold text-[#1C1613]">
                {formatINR(variant.price)}
              </span>
              {variant.mrp && (
                <span className="text-sm text-[#6E6058] line-through">
                  {formatINR(variant.mrp)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-xs font-semibold text-[#C2410C]">
                  Save {discount}%
                </span>
              )}
              <span className="text-xs text-[#6E6058]">· Inclusive of all taxes</span>
            </div>

            {/* Variant Selector */}
            <div className="mt-5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#6E6058]">
                Select Variant / Size
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v, idx) => {
                  const active = idx === selectedVariantIdx;
                  return (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                        active
                          ? 'border-[#C2410C] bg-[#C2410C]/8 text-[#1C1613]'
                          : 'border-[#EAE1D8] bg-white text-[#6E6058] hover:border-[#1C1613]'
                      }`}
                    >
                      {v.swatchHex && (
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/15"
                          style={{ backgroundColor: v.swatchHex }}
                          aria-hidden="true"
                        />
                      )}
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purchase Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-[#EAE1D8] bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="px-3 py-2.5 text-sm font-semibold text-[#1C1613] hover:bg-[#F3ECE4]"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  aria-label="Increase quantity"
                  className="px-3 py-2.5 text-sm font-semibold text-[#1C1613] hover:bg-[#F3ECE4]"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToBag(product, selectedVariantIdx, quantity);
                  onClose();
                }}
                className="flex-1 min-w-[160px] rounded-lg bg-[#C2410C] px-4 sm:px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C]"
              >
                Add to Bag · {formatINR(variant.price * quantity)}
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#EAE1D8] bg-white px-4 py-3 text-sm font-medium text-[#1C1613] hover:border-[#1C1613]"
              >
                <Heart
                  className={`h-4 w-4 ${
                    isWishlisted ? 'fill-[#C2410C] text-[#C2410C]' : 'text-[#6E6058]'
                  }`}
                />
                <span>{isWishlisted ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            {/* Info Tabs */}
            <div className="mt-6 sm:mt-7 border-t border-[#EAE1D8] pt-5">
              <div className="flex gap-4 sm:gap-6 border-b border-[#EAE1D8] overflow-x-auto" role="tablist">
                {(
                  [
                    ['overview', 'Overview'],
                    ['ingredients', 'Key Ingredients'],
                    ['usage', 'How to Use'],
                  ] as const
                ).map(([tabId, label]) => (
                  <button
                    key={tabId}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tabId}
                    onClick={() => setActiveTab(tabId)}
                    className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tabId
                        ? 'border-[#C2410C] text-[#1C1613]'
                        : 'border-transparent text-[#6E6058] hover:text-[#1C1613]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 text-sm text-[#574B44] leading-relaxed">
                {activeTab === 'overview' && <p>{product.description}</p>}
                {activeTab === 'ingredients' && (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.keyIngredients.map((ing) => (
                      <li key={ing} className="flex items-center gap-2 text-xs text-[#1C1613]">
                        <Check className="h-3.5 w-3.5 text-[#C2410C] shrink-0" aria-hidden="true" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {activeTab === 'usage' && <p>{product.howToUse}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
