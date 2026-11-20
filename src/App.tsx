import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ConfirmationResult,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  RecaptchaVerifier,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { Heart, Menu, Search, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { CATEGORIES, PRODUCTS, SEEDED_ORDERS } from './data/catalog';
import { auth, googleProvider, missingFirebaseEnvVars } from './firebase';
import {
  ActiveView,
  CartItem,
  CategoryId,
  CustomerProfile,
  OrderRecord,
  Product,
  ServiceBooking,
} from './types/store';
import {
  calculateCartTotals,
  mapFirebaseAuthError,
  normalizeIndianPhoneNumber,
} from './utils/storeLogic';
import {
  ensureCustomerDocs,
  saveBookingToCloud,
  saveCustomerDeliveryProfile,
  saveOrderToCloud,
  subscribeCustomerData,
  syncWishlistToCloud,
} from './services/customerAccountService';
import { BagDrawer } from './components/BagDrawer';
import { BrandsView } from './components/BrandsView';
import { CatalogView } from './components/CatalogView';
import { CustomerAuthView } from './components/CustomerAuthView';
import {
  ContactView,
  EditorialPolicyView,
  FaqView,
  TrackOrderView,
  WishlistView,
} from './components/HelpAndInfoViews';
import { HomeView } from './components/HomeView';
import { GiftCardsView, GiftCardStyleSelection, OffersView } from './components/OffersAndGiftCardsView';
import {
  AppStoreFooterBadges,
  OfflineIndicator,
  PWAInstallButton,
} from './components/MobileAppInstall';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ServicesView } from './components/ServicesView';

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [view, setView] = useState<ActiveView>('home');
  const [category, setCategory] = useState<CategoryId>('all');
  const [subCategory, setSubCategory] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dealOnly, setDealOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>(
    'featured'
  );

  const [cart, setCart] = useState<CartItem[]>(() => loadStored('bf_cart', []));
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => loadStored('bf_wishlist', []));
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    loadStored('bf_orders', SEEDED_ORDERS)
  );
  const [bookings, setBookings] = useState<ServiceBooking[]>(() =>
    loadStored('bf_bookings', [])
  );
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() =>
    loadStored('bf_coupon', null)
  );

  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [trackOrderSeed, setTrackOrderSeed] = useState<string>('');
  const [showPromoBar, setShowPromoBar] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authRevision, setAuthRevision] = useState(0);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [cloudOrders, setCloudOrders] = useState<OrderRecord[]>([]);
  const [cloudBookings, setCloudBookings] = useState<ServiceBooking[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [pendingOtpConfirmation, setPendingOtpConfirmation] = useState<ConfirmationResult | null>(
    null
  );
  const [pendingPhoneLabel, setPendingPhoneLabel] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const clearRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // Ignore already-cleared widget errors
      }
      recaptchaVerifierRef.current = null;
    }
  };

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (!user) {
        setCustomerProfile(null);
        setCloudOrders([]);
        setCloudBookings([]);
      }
    });
    return () => {
      unsub();
      clearRecaptcha();
    };
  }, []);

  const currentSessionUser = auth?.currentUser ?? authUser;
  const isCloudVerified = Boolean(
    currentSessionUser && (currentSessionUser.emailVerified || currentSessionUser.phoneNumber)
  );

  useEffect(() => {
    if (!authReady || !authUser || !isCloudVerified) return;
    let active = true;
    let unsubData: (() => void) | null = null;

    ensureCustomerDocs(authUser, wishlistIds)
      .then(() => {
        if (!active) return;
        unsubData = subscribeCustomerData(authUser, {
          onProfile: (prof) => {
            setCustomerProfile(prof);
            if (prof.wishlistIds.length > 0) {
              setWishlistIds((prev) => Array.from(new Set([...prev, ...prof.wishlistIds])).slice(0, 50));
            }
          },
          onOrders: (ordList) => setCloudOrders(ordList),
          onBookings: (bkList) => setCloudBookings(bkList),
        });
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Quota exceeded')) {
          setAuthError('Firestore daily quota reached. Your local session continues to work.');
        } else if (msg.includes('Missing or insufficient permissions')) {
          setAuthError('Cloud sync requires a verified Email ID or Mobile OTP session.');
        }
      });

    return () => {
      active = false;
      if (unsubData) unsubData();
    };
  }, [authReady, authUser, isCloudVerified, authRevision]);

  useEffect(() => {
    try {
      localStorage.setItem('bf_cart', JSON.stringify(cart));
      localStorage.setItem('bf_wishlist', JSON.stringify(wishlistIds));
      localStorage.setItem('bf_orders', JSON.stringify(orders));
      localStorage.setItem('bf_bookings', JSON.stringify(bookings));
      localStorage.setItem('bf_coupon', JSON.stringify(appliedCoupon));
    } catch {
      // Ignore storage quota issues
    }
  }, [cart, wishlistIds, orders, bookings, appliedCoupon]);

  const notify = (msg: string) => {
    setToast(msg);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const navigate = (nextView: ActiveView) => {
    setView(nextView);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateCategory = (cat: CategoryId, deals = false) => {
    setCategory(cat);
    setSubCategory('all');
    setBrandFilter('all');
    setDealOnly(deals);
    setView('catalog');
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBrand = (brandName: string) => {
    setCategory('all');
    setSubCategory('all');
    setBrandFilter(brandName);
    setDealOnly(false);
    setSearchQuery('');
    setView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setCategory('all');
    setSubCategory('all');
    setBrandFilter('all');
    setSearchQuery('');
    setDealOnly(false);
    setSortBy('featured');
  };

  const addProductToBag = (product: Product, variantIndex = 0, qty = 1) => {
    const variant = product.variants[variantIndex] ?? product.variants[0];
    const key = `${product.id}::${variant.label}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          brand: product.brand,
          name: product.name,
          variantLabel: variant.label,
          price: variant.price,
          mrp: variant.mrp,
          quantity: qty,
          visualForm: product.visualForm,
          imageUrl: product.imageUrl,
          surfaceTone: product.surfaceTone,
          accentTone: product.accentTone,
        },
      ];
    });
    notify(`Added ${product.name} to bag`);
  };

  const handleAddGiftCard = (
    amount: number,
    recipientEmail: string,
    message: string,
    cardStyle?: GiftCardStyleSelection
  ) => {
    const editionLabel = cardStyle?.editionLabel || 'Espresso Signature';
    const key = `gift-${amount}-${recipientEmail}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setCart((prev) => [
      ...prev,
      {
        key,
        productId: 'gift-card',
        brand: 'kcross india store',
        name: `kcross india store ${editionLabel} Gift Card`,
        variantLabel: `For ${recipientEmail}`,
        price: amount,
        mrp: null,
        quantity: 1,
        visualForm: 'giftcard',
        surfaceTone: cardStyle?.surfaceTone || '#FFF3EB',
        accentTone: cardStyle?.accentTone || '#C2410C',
        isGiftCard: true,
        giftRecipientEmail: recipientEmail,
        giftMessage: message,
      },
    ]);
    notify(`Added ₹${amount.toLocaleString('en-IN')} Gift Card to bag`);
    setIsBagOpen(true);
  };

  const handleUpdateQuantity = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const handleToggleWishlist = (productId: string) => {
    const exists = wishlistIds.includes(productId);
    const next = exists ? wishlistIds.filter((id) => id !== productId) : [...wishlistIds, productId];
    setWishlistIds(next);
    notify(exists ? 'Removed from wishlist' : 'Saved to wishlist');
    if (authReady && authUser && isCloudVerified) {
      void syncWishlistToCloud(authUser.uid, next).catch(() => {});
    }
  };

  const handlePlaceOrder = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
    setCart([]);
    setAppliedCoupon(null);
    notify(`Order ${order.orderNumber} confirmed`);
    if (authReady && authUser && isCloudVerified) {
      void saveOrderToCloud(authUser.uid, order).catch((err) => {
        if (err instanceof Error && err.message.includes('Quota exceeded')) {
          notify('Saved locally. Daily cloud database quota reached.');
        }
      });
    }
  };

  const handleCreateBooking = (booking: ServiceBooking) => {
    setBookings((prev) => [booking, ...prev]);
    notify(`Appointment ${booking.id} confirmed`);
    if (authReady && authUser && isCloudVerified) {
      void saveBookingToCloud(authUser.uid, booking).catch((err) => {
        if (err instanceof Error && err.message.includes('Quota exceeded')) {
          notify('Saved locally. Daily cloud database quota reached.');
        }
      });
    }
  };

  const showFirebaseEnvError = () => {
    const missingText =
      missingFirebaseEnvVars.length > 0 ? missingFirebaseEnvVars.join(', ') : 'VITE_FIREBASE_*';
    setAuthError(
      `Cloud sign-in requires Firebase build environment variables (${missingText}) to be configured in your hosting dashboard (such as Cloudflare Pages Settings -> Environment variables) and redeployed.`
    );
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    if (!auth || !googleProvider) {
      showFirebaseEnvError();
      return;
    }
    setIsSigningIn(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      setPendingOtpConfirmation(null);
      setPendingPhoneLabel(null);
      clearRecaptcha();
      notify(`Signed in as ${cred.user.displayName || cred.user.email}`);
    } catch (error) {
      const code = (error as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthError(code, window.location.hostname));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSendPhoneOtp = async (rawPhone: string, recaptchaContainer: HTMLElement | null) => {
    setAuthError(null);
    if (!auth) {
      showFirebaseEnvError();
      return;
    }
    if (!recaptchaContainer) {
      setAuthError('Security check container is not ready. Please try again.');
      return;
    }
    const normalizedPhone = normalizeIndianPhoneNumber(rawPhone);
    if (!normalizedPhone) {
      setAuthError('Enter a valid 10-digit Indian mobile number or include country code (+91...).');
      return;
    }
    setIsSigningIn(true);
    try {
      clearRecaptcha();
      const verifier = new RecaptchaVerifier(auth, recaptchaContainer, {
        size: 'invisible',
      });
      recaptchaVerifierRef.current = verifier;
      const confirmation = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
      setPendingOtpConfirmation(confirmation);
      setPendingPhoneLabel(normalizedPhone);
      notify(`OTP sent to ${normalizedPhone}`);
    } catch (error) {
      clearRecaptcha();
      const code = (error as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthError(code, window.location.hostname));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleVerifyPhoneOtp = async (otpCode: string, optionalName?: string) => {
    setAuthError(null);
    if (!pendingOtpConfirmation) {
      setAuthError('Your OTP session expired. Please request a new OTP.');
      return;
    }
    setIsSigningIn(true);
    try {
      const cred = await pendingOtpConfirmation.confirm(otpCode.trim());
      if (optionalName && optionalName.trim()) {
        await updateProfile(cred.user, {
          displayName: optionalName.trim().slice(0, 120),
        });
      }
      setPendingOtpConfirmation(null);
      setPendingPhoneLabel(null);
      clearRecaptcha();
      setAuthRevision((r) => r + 1);
      notify(`Signed in with ${cred.user.phoneNumber || 'mobile number'}`);
    } catch (error) {
      const code = (error as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthError(code, window.location.hostname));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleResetPhoneOtp = () => {
    setPendingOtpConfirmation(null);
    setPendingPhoneLabel(null);
    setAuthError(null);
    clearRecaptcha();
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setAuthError(null);
    if (!auth) {
      showFirebaseEnvError();
      return;
    }
    setIsSigningIn(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      setPendingOtpConfirmation(null);
      setPendingPhoneLabel(null);
      clearRecaptcha();
      notify(`Signed in as ${cred.user.displayName || cred.user.email}`);
    } catch (error) {
      const code = (error as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthError(code, window.location.hostname));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailRegister = async (fullName: string, email: string, password: string) => {
    setAuthError(null);
    if (!auth) {
      showFirebaseEnvError();
      return;
    }
    setIsSigningIn(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, {
        displayName: fullName.trim().slice(0, 120),
      });
      await sendEmailVerification(cred.user).catch(() => {});
      setPendingOtpConfirmation(null);
      setPendingPhoneLabel(null);
      clearRecaptcha();
      setAuthRevision((r) => r + 1);
      notify(`Account created! Verify ${email.trim()} via the link sent to your inbox.`);
    } catch (error) {
      const code = (error as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthError(code, window.location.hostname));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSendPasswordReset = async (email: string): Promise<boolean> => {
    setAuthError(null);
    if (!auth) {
      showFirebaseEnvError();
      return false;
    }
    setIsSigningIn(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      notify(`Password reset link sent to ${email.trim()}`);
      return true;
    } catch (error) {
      const code = (error as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthError(code, window.location.hostname));
      return false;
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth?.currentUser || auth.currentUser.emailVerified) return;
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await sendEmailVerification(auth.currentUser);
      notify(`Verification link sent to ${auth.currentUser.email}`);
    } catch (error) {
      const code = (error as { code?: string })?.code || '';
      setAuthError(mapFirebaseAuthError(code, window.location.hostname));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRefreshSession = async () => {
    if (!auth?.currentUser) return;
    setIsSigningIn(true);
    try {
      await reload(auth.currentUser);
      setAuthRevision((r) => r + 1);
      if (auth.currentUser.emailVerified) {
        notify('Email verified! Cloud profile & wishlist sync enabled.');
      } else {
        notify('Still awaiting email verification. Check your inbox or spam folder.');
      }
    } catch {
      notify('Unable to refresh session status right now.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setPendingOtpConfirmation(null);
      setPendingPhoneLabel(null);
      clearRecaptcha();
      setAuthError(null);
      notify('Signed out of your customer account');
    } catch {
      notify('Unable to sign out right now');
    }
  };

  const handleSaveProfile = async (data: {
    displayName: string;
    email?: string;
    phoneNumber?: string;
    defaultAddress: string;
    defaultCity: string;
    defaultPinCode: string;
  }) => {
    if (!authUser) return;
    if (!isCloudVerified) {
      throw new Error('Verify your email ID before syncing delivery details to cloud.');
    }
    await saveCustomerDeliveryProfile(authUser.uid, {
      displayName: data.displayName,
      email: data.email ?? customerProfile?.email ?? authUser.email ?? '',
      phoneNumber: data.phoneNumber ?? customerProfile?.phoneNumber ?? authUser.phoneNumber ?? '',
      defaultAddress: data.defaultAddress,
      defaultCity: data.defaultCity,
      defaultPinCode: data.defaultPinCode,
      wishlistIds,
    });
    notify('Saved delivery profile');
  };

  const mergedOrders = useMemo(() => {
    const map = new Map<string, OrderRecord>();
    for (const o of cloudOrders) map.set(o.orderNumber, o);
    for (const o of orders) {
      if (!map.has(o.orderNumber)) map.set(o.orderNumber, o);
    }
    return Array.from(map.values());
  }, [cloudOrders, orders]);

  const mergedBookings = useMemo(() => {
    const map = new Map<string, ServiceBooking>();
    for (const b of cloudBookings) map.set(b.id, b);
    for (const b of bookings) {
      if (!map.has(b.id)) map.set(b.id, b);
    }
    return Array.from(map.values());
  }, [cloudBookings, bookings]);

  const customerPrefill = useMemo(() => {
    if (!authUser) return undefined;
    return {
      name: customerProfile?.displayName || authUser.displayName || '',
      email: customerProfile?.email || authUser.email || '',
      address: customerProfile?.defaultAddress || '',
      city: customerProfile?.defaultCity || '',
      pinCode: customerProfile?.defaultPinCode || '',
    };
  }, [authUser, customerProfile]);

  const customerLabel = authUser
    ? (
        customerProfile?.displayName ||
        authUser.displayName ||
        authUser.email?.split('@')[0] ||
        authUser.phoneNumber ||
        'Account'
      )
        .split(' ')[0]
        .slice(0, 12)
    : 'Sign In';

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCategory('all');
    setSubCategory('all');
    setBrandFilter('all');
    setDealOnly(false);
    setView('catalog');
  };

  const totals = calculateCartTotals(cart, appliedCoupon);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#1C1613]">
      {/* Slim Dismissible Announcement Bar (<= 34px) */}
      {showPromoBar && (
        <div className="bg-[#1C1613] text-[#FCF9F5] text-xs px-4 py-1.5 flex items-center justify-center relative">
          <p className="truncate pr-6">
            Free shipping over ₹999 · 100% Authentic &amp; Direct from Brands · Use code{' '}
            <span className="font-mono-num text-[#FDBA74]">GLOW15</span>
          </p>
          <button
            type="button"
            onClick={() => setShowPromoBar(false)}
            aria-label="Dismiss announcement"
            className="absolute right-3 p-1 text-white/70 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-30 border-b border-[#EAE1D8] bg-[#FCF9F5]/95 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-5 lg:gap-8">
          {/* Zone 1: Brand logo + wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              navigate('home');
            }}
            className="inline-flex items-center gap-1.5 sm:gap-2.5 font-display text-[15px] sm:text-lg lg:text-xl font-bold tracking-tight text-[#1C1613] whitespace-nowrap shrink-0"
          >
            <img
              src="/assets/aistudio/imgi_5_images_e8c25121.jpg"
              alt="Kcross india"
              width={32}
              height={32}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-md object-contain bg-white border border-[#EAE1D8] shrink-0"
            />
            <span>kcross india store</span>
          </a>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-7 text-sm font-medium text-[#574B44]">
            {(
              [
                ['catalog', 'Catalog'],
                ['brands', 'Brands'],
                ['services', 'Services'],
                ['offers', 'Offers'],
                ['gift-cards', 'Gift Cards'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(key)}
                className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#1C1613] ${
                  view === key ? 'text-[#C2410C] font-semibold' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Customer Account + Bag action + Mobile menu button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('login')}
              aria-label={authUser ? 'Open customer account' : 'Open customer login'}
              className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border px-2 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                view === 'login'
                  ? 'border-[#C2410C] bg-[#C2410C]/10 text-[#C2410C]'
                  : 'border-[#EAE1D8] bg-white text-[#1C1613] hover:border-[#1C1613]'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{customerLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBagOpen(true)}
              aria-label={`Open shopping bag (${totals.itemCount} items)`}
              className="inline-flex items-center gap-1 sm:gap-2 rounded-lg bg-[#1C1613] px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#332924]"
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">Bag ({totals.itemCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[#EAE1D8] bg-white text-[#1C1613] shrink-0"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#EAE1D8] bg-white px-4 py-2 shadow-lg">
            {(
              [
                ['home', 'Home'],
                ['catalog', 'All Products'],
                ['brands', 'Brands'],
                ['services', 'Services & Stores'],
                ['offers', 'Offers'],
                ['gift-cards', 'Gift Cards'],
                ['wishlist', `Wishlist (${wishlistIds.length})`],
                ['track-order', 'Track Order'],
                ['login', authUser ? 'My Account' : 'Customer Login'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(key)}
                className={`block w-full text-left py-2.5 text-sm border-b border-[#F3ECE4] last:border-b-0 transition-colors ${
                  view === key
                    ? 'font-semibold text-[#C2410C]'
                    : 'font-medium text-[#1C1613]'
                }`}
              >
                {label}
              </button>
            ))}
            <div className="pt-2 pb-1">
              <PWAInstallButton className="w-full" />
            </div>
          </div>
        )}
      </header>

      {/* Non-sticky First Navigation Layer: Departments + Search + Wishlist */}
      <div className="border-b border-[#EAE1D8] bg-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-x-3.5 sm:gap-x-4 gap-y-1 text-xs font-medium text-[#574B44]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigateCategory(cat.id, false)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#C2410C] ${
                  view === 'catalog' && category === cat.id
                    ? 'text-[#C2410C] font-semibold'
                    : ''
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <form onSubmit={handleHeaderSearchSubmit} className="relative flex-1 lg:w-56">
              <Search
                className="h-3.5 w-3.5 text-[#6E6058] absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  const nextVal = e.target.value;
                  setSearchQuery(nextVal);
                  if (view !== 'catalog' && nextVal.trim().length > 0) {
                    setCategory('all');
                    setSubCategory('all');
                    setBrandFilter('all');
                    setDealOnly(false);
                    setView('catalog');
                  }
                }}
                placeholder="Search brands & products"
                aria-label="Search brands and products"
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] pl-8 pr-3 py-1.5 text-xs text-[#1C1613] placeholder:text-[#8A7B72] focus:border-[#C2410C] focus:outline-none"
              />
            </form>

            <button
              type="button"
              onClick={() => navigate('wishlist')}
              aria-label={`Open wishlist (${wishlistIds.length} saved)`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#574B44] hover:text-[#C2410C] whitespace-nowrap shrink-0 py-1"
            >
              <Heart
                className={`h-3.5 w-3.5 ${
                  wishlistIds.length > 0 ? 'fill-[#C2410C] text-[#C2410C]' : ''
                }`}
                aria-hidden="true"
              />
              <span className="tabular-nums">Wishlist ({wishlistIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        {view === 'home' && (
          <HomeView
            wishlistIds={wishlistIds}
            onSelectProduct={setSelectedProduct}
            onQuickAdd={(p) => addProductToBag(p, 0, 1)}
            onToggleWishlist={handleToggleWishlist}
            onNavigateCategory={navigateCategory}
            onNavigateView={navigate}
          />
        )}

        {view === 'catalog' && (
          <CatalogView
            category={category}
            subCategory={subCategory}
            brand={brandFilter}
            searchQuery={searchQuery}
            dealOnly={dealOnly}
            sortBy={sortBy}
            wishlistIds={wishlistIds}
            onChangeCategory={setCategory}
            onChangeSubCategory={setSubCategory}
            onChangeBrand={setBrandFilter}
            onChangeSearch={setSearchQuery}
            onToggleDealOnly={setDealOnly}
            onChangeSort={setSortBy}
            onResetFilters={handleResetFilters}
            onSelectProduct={setSelectedProduct}
            onQuickAdd={(p) => addProductToBag(p, 0, 1)}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {view === 'brands' && <BrandsView onSelectBrand={handleSelectBrand} />}

        {view === 'services' && (
          <ServicesView
            bookings={mergedBookings}
            defaultCustomer={customerPrefill}
            onCreateBooking={handleCreateBooking}
          />
        )}

        {view === 'offers' && (
          <OffersView
            activeCoupon={appliedCoupon}
            wishlistIds={wishlistIds}
            onApplyCouponAndOpenBag={(code) => {
              setAppliedCoupon(code);
              setIsBagOpen(true);
            }}
            onSelectProduct={setSelectedProduct}
            onQuickAdd={(p) => addProductToBag(p, 0, 1)}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {view === 'gift-cards' && <GiftCardsView onAddGiftCardToBag={handleAddGiftCard} />}

        {view === 'wishlist' && (
          <WishlistView
            wishlistIds={wishlistIds}
            onSelectProduct={setSelectedProduct}
            onQuickAdd={(p) => addProductToBag(p, 0, 1)}
            onToggleWishlist={handleToggleWishlist}
            onBrowseCatalog={() => navigateCategory('all', false)}
          />
        )}

        {view === 'track-order' && (
          <TrackOrderView orders={mergedOrders} initialOrderNumber={trackOrderSeed} />
        )}

        {view === 'login' && (
          <CustomerAuthView
            authReady={authReady}
            authUser={authUser}
            isCloudVerified={isCloudVerified}
            profile={customerProfile}
            orders={mergedOrders}
            bookings={mergedBookings}
            wishlistCount={wishlistIds.length}
            authError={authError}
            isSigningIn={isSigningIn}
            pendingPhoneLabel={pendingPhoneLabel}
            onSignInWithGoogle={handleGoogleSignIn}
            onSendPhoneOtp={handleSendPhoneOtp}
            onVerifyPhoneOtp={handleVerifyPhoneOtp}
            onResetPhoneOtp={handleResetPhoneOtp}
            onEmailSignIn={handleEmailSignIn}
            onEmailRegister={handleEmailRegister}
            onSendPasswordReset={handleSendPasswordReset}
            onResendVerification={handleResendVerification}
            onRefreshSession={handleRefreshSession}
            onClearAuthError={() => setAuthError(null)}
            onSignOut={handleSignOut}
            onSaveProfile={handleSaveProfile}
            onNavigateView={navigate}
            onTrackOrder={(orderNo) => {
              setTrackOrderSeed(orderNo);
              navigate('track-order');
            }}
          />
        )}

        {view === 'contact' && <ContactView />}
        {view === 'faq' && <FaqView />}
        {(view === 'returns' ||
          view === 'shipping' ||
          view === 'our-story' ||
          view === 'ingredients') && <EditorialPolicyView mode={view} />}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-[#EAE1D8] bg-white text-sm text-[#574B44]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-3 lg:col-span-1 space-y-2.5">
            <div className="inline-flex items-center gap-2.5">
              <img
                src="/assets/aistudio/imgi_5_images_e8c25121.jpg"
                alt="Kcross india"
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-contain bg-white border border-[#EAE1D8] shrink-0"
              />
              <span className="font-display text-2xl font-semibold text-[#1C1613] block">
                kcross india store
              </span>
            </div>
            <p className="text-xs text-[#6E6058] max-w-[32ch] leading-relaxed">
              Curated beauty, salon haircare, luxury fragrances &amp; in-store studio services
              across India.
            </p>
            <p className="text-xs text-[#1C1613] font-medium pt-1">
              help@kcrossindia.store
            </p>
            <AppStoreFooterBadges />
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#1C1613] mb-3">
              Departments
            </h3>
            <ul className="space-y-2 text-xs">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => navigateCategory(c.id, false)}
                    className="hover:text-[#C2410C]"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#1C1613] mb-3">
              Help &amp; Policies
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => navigate('track-order')} className="hover:text-[#C2410C]">
                  Track Order
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('returns')} className="hover:text-[#C2410C]">
                  Returns &amp; Cancellations
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('shipping')} className="hover:text-[#C2410C]">
                  Shipping Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('faq')} className="hover:text-[#C2410C]">
                  FAQs
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('contact')} className="hover:text-[#C2410C]">
                  Contact Us / Help Centre
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#1C1613] mb-3">
              Services &amp; Company
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button type="button" onClick={() => navigate('login')} className="hover:text-[#C2410C]">
                  {authUser ? 'My Account' : 'Customer Login'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('services')} className="hover:text-[#C2410C]">
                  Find a Studio Store
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('gift-cards')} className="hover:text-[#C2410C]">
                  Gift Cards
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('our-story')} className="hover:text-[#C2410C]">
                  Our Story
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('ingredients')} className="hover:text-[#C2410C]">
                  Ingredient Standards
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#EAE1D8] px-4 sm:px-6 py-4 mx-auto max-w-[1200px] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6058]">
          <span>© 2026 kcross india store · kcrossindia.store. All rights reserved.</span>
          <span>100% Authentic · Direct Brand Sourcing · Pan-India Delivery</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onClose={() => setSelectedProduct(null)}
        onAddToBag={addProductToBag}
        onToggleWishlist={handleToggleWishlist}
      />

      <BagDrawer
        isOpen={isBagOpen}
        items={cart}
        appliedCoupon={appliedCoupon}
        defaultCustomer={customerPrefill}
        onClose={() => setIsBagOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onApplyCoupon={setAppliedCoupon}
        onPlaceOrder={handlePlaceOrder}
        onTrackOrder={(orderNo) => {
          setTrackOrderSeed(orderNo);
          navigate('track-order');
        }}
      />

      <OfflineIndicator />

      {/* Toast feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] text-center rounded-lg bg-[#1C1613] px-4 py-2.5 text-xs font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
