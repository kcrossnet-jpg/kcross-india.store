import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { Product } from '../types/store';
import { formatINR, getDiscountPercent } from '../utils/storeLogic';
import { ProductArt } from './ProductArt';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onSelect,
  onQuickAdd,
  onToggleWishlist,
}) => {
  const discount = getDiscountPercent(product.price, product.mrp);

  return (
    <article className="group flex flex-col bg-white border border-[#EAE4E0] rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(30,22,26,0.06)]">
      <div className="relative">
        <button
          type="button"
          onClick={() => onSelect(product)}
          className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E68]"
          aria-label={`View details for ${product.brand} ${product.name}`}
        >
          <ProductArt
            form={product.visualForm}
            brand={product.brand}
            surfaceTone={product.surfaceTone}
            accentTone={product.accentTone}
            className="aspect-[4/3] w-full"
          />
        </button>

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Save ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-[#1E161A] border border-[#EAE4E0] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E68]"
        >
          <Heart
            className={`h-4 w-4 ${
              isWishlisted ? 'fill-[#C41E68] text-[#C41E68]' : 'text-[#6E5F66]'
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Zero-pill metadata line with typographic separator */}
        <div className="flex items-center gap-1.5 text-xs text-[#6E5F66] truncate">
          <span className="font-semibold text-[#1E161A]">{product.brand}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{product.subCategory}</span>
          {product.tag && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#C41E68] shrink-0">{product.tag}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(product)}
          className="mt-1.5 text-left text-base font-semibold leading-snug text-[#1E161A] hover:text-[#C41E68] transition-colors focus-visible:outline-none"
        >
          {product.name}
        </button>

        <p className="mt-1 text-xs text-[#6E5F66] line-clamp-1">{product.subtitle}</p>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-[#F3EFEC]">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-[15px] font-bold text-[#1E161A]">
                {formatINR(product.price)}
              </span>
              {product.mrp && (
                <span className="text-xs text-[#6E5F66] line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>
            {discount > 0 ? (
              <span className="block text-[11px] font-semibold text-[#9E355B] tabular-nums">
                Save {discount}%
              </span>
            ) : (
              <span className="block text-[11px] text-[#6E5F66] tabular-nums">
                {product.rating.toFixed(1)} ({product.reviewCount})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onQuickAdd(product)}
            aria-label={`Add ${product.name} to bag`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E161A] bg-transparent px-3 py-2 text-xs font-semibold text-[#1E161A] whitespace-nowrap shrink-0 transition-colors hover:bg-[#1E161A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E68]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
};
