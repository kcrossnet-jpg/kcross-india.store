import React from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, PRODUCTS } from '../data/catalog';
import { CategoryId, Product } from '../types/store';
import { filterProducts } from '../utils/storeLogic';
import { ProductCard } from './ProductCard';

interface CatalogViewProps {
  category: CategoryId;
  subCategory: string;
  brand: string;
  searchQuery: string;
  dealOnly: boolean;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'discount';
  wishlistIds: string[];
  onChangeCategory: (cat: CategoryId) => void;
  onChangeSubCategory: (sub: string) => void;
  onChangeBrand: (brand: string) => void;
  onChangeSearch: (q: string) => void;
  onToggleDealOnly: (val: boolean) => void;
  onChangeSort: (sort: 'featured' | 'price-asc' | 'price-desc' | 'discount') => void;
  onResetFilters: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  category,
  subCategory,
  brand,
  searchQuery,
  dealOnly,
  sortBy,
  wishlistIds,
  onChangeCategory,
  onChangeSubCategory,
  onChangeBrand,
  onChangeSearch,
  onToggleDealOnly,
  onChangeSort,
  onResetFilters,
  onSelectProduct,
  onQuickAdd,
  onToggleWishlist,
}) => {
  const uniqueBrands = Array.from(new Set(PRODUCTS.map((p) => p.brand))).sort();
  const activeCatInfo = CATEGORIES.find((c) => c.id === category);

  const results = filterProducts(PRODUCTS, {
    category,
    subCategory,
    brand,
    query: searchQuery,
    dealOnly,
    sortBy,
  });

  const hasActiveFilter =
    category !== 'all' ||
    subCategory !== 'all' ||
    brand !== 'all' ||
    searchQuery.trim() !== '' ||
    dealOnly;

  return (
    <section className="py-8 sm:py-10 space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 border-b border-[#EAE4E0] pb-5 sm:pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
            {brand !== 'all' ? `${brand} Edit` : 'Complete Storefront Catalog'}
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
            {activeCatInfo ? activeCatInfo.label : 'All Beauty Products'}
          </h1>
          <p className="mt-1.5 text-sm text-[#6E5F66]">
            {activeCatInfo
              ? activeCatInfo.tagline
              : `Browse all ${PRODUCTS.length} curated skincare, makeup, haircare, fragrance, bath & appliance essentials.`}
          </p>
        </div>

        <span className="text-sm font-medium text-[#6E5F66] tabular-nums">
          Showing {results.length} of {PRODUCTS.length} products
        </span>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onChangeCategory('all');
            onChangeSubCategory('all');
          }}
          className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            category === 'all'
              ? 'bg-[#1E161A] text-white'
              : 'bg-white border border-[#EAE4E0] text-[#5C4F55] hover:border-[#1E161A]'
          }`}
        >
          All Departments
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              onChangeCategory(cat.id);
              onChangeSubCategory('all');
            }}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              category === cat.id
                ? 'bg-[#C41E68] text-white'
                : 'bg-white border border-[#EAE4E0] text-[#5C4F55] hover:border-[#1E161A]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Subcategories if a specific category is selected */}
      {activeCatInfo && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#6E5F66] font-medium mr-1">Focus:</span>
          <button
            type="button"
            onClick={() => onChangeSubCategory('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              subCategory === 'all'
                ? 'bg-[#EFEBE8] text-[#1E161A]'
                : 'text-[#6E5F66] hover:text-[#1E161A]'
            }`}
          >
            All {activeCatInfo.label}
          </button>
          {activeCatInfo.subCategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => onChangeSubCategory(sub)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                subCategory.toLowerCase() === sub.toLowerCase()
                  ? 'bg-[#EFEBE8] text-[#1E161A]'
                  : 'text-[#6E5F66] hover:text-[#1E161A]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Search + Brand + Weekly Deal + Sort Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center bg-white border border-[#EAE4E0] rounded-xl p-3 sm:p-3.5">
        <div className="sm:col-span-2 lg:col-span-5 relative">
          <Search
            className="h-4 w-4 text-[#6E5F66] absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search by product, brand, or ingredient (e.g. Olaplex, Snail, SPF)"
            aria-label="Search catalog products"
            className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] pl-9 pr-3 py-2 text-sm text-[#1E161A] placeholder:text-[#8B7D84] focus:border-[#C41E68] focus:outline-none"
          />
        </div>

        <div className="lg:col-span-3">
          <label className="sr-only" htmlFor="brand-filter">
            Filter by brand
          </label>
          <select
            id="brand-filter"
            value={brand}
            onChange={(e) => onChangeBrand(e.target.value)}
            className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3 py-2 text-sm text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
          >
            <option value="all">All Brands ({uniqueBrands.length})</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="sr-only" htmlFor="sort-select">
            Sort products
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) =>
              onChangeSort(
                e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'discount'
              )
            }
            className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3 py-2 text-sm text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-between lg:justify-end gap-2">
          <button
            type="button"
            onClick={() => onToggleDealOnly(!dealOnly)}
            aria-pressed={dealOnly}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              dealOnly
                ? 'border-[#C41E68] bg-[#C41E68]/10 text-[#C41E68]'
                : 'border-[#EAE4E0] bg-[#FAF8F6] text-[#5C4F55] hover:text-[#1E161A]'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Deals Only</span>
          </button>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              aria-label="Reset all filters"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#6E5F66] hover:text-[#1E161A] whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Grid or Empty State */}
      {results.length === 0 ? (
        <div className="rounded-2xl border border-[#EAE4E0] bg-white p-8 sm:p-12 text-center">
          <h2 className="font-display text-2xl font-medium text-[#1E161A]">
            No matching products found
          </h2>
          <p className="mt-2 text-sm text-[#6E5F66]">
            Try clearing a filter or searching for brands like OLAPLEX, Davidoff, CeraVe, or PAC.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 rounded-lg bg-[#1E161A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#352A30]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {results.map((product) => (
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
      )}
    </section>
  );
};
