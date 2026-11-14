import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Heart,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  ActiveView,
  CustomerProfile,
  OrderRecord,
  ServiceBooking,
} from '../types/store';
import { formatINR, validateCustomerProfileForm } from '../utils/storeLogic';
import { PWAInstallButton } from './MobileAppInstall';

interface CustomerAuthViewProps {
  authReady: boolean;
  authUser: User | null;
  profile: CustomerProfile | null;
  orders: OrderRecord[];
  bookings: ServiceBooking[];
  wishlistCount: number;
  authError: string | null;
  isSigningIn: boolean;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  onSaveProfile: (data: {
    displayName: string;
    defaultAddress: string;
    defaultCity: string;
    defaultPinCode: string;
  }) => Promise<void>;
  onNavigateView: (view: ActiveView) => void;
  onTrackOrder: (orderNumber: string) => void;
}

export const CustomerAuthView: React.FC<CustomerAuthViewProps> = ({
  authReady,
  authUser,
  profile,
  orders,
  bookings,
  wishlistCount,
  authError,
  isSigningIn,
  onSignInWithGoogle,
  onSignOut,
  onSaveProfile,
  onNavigateView,
  onTrackOrder,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [defaultCity, setDefaultCity] = useState('');
  const [defaultPinCode, setDefaultPinCode] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || authUser?.displayName || '');
      setDefaultAddress(profile.defaultAddress || '');
      setDefaultCity(profile.defaultCity || '');
      setDefaultPinCode(profile.defaultPinCode || '');
    } else if (authUser) {
      setDisplayName(authUser.displayName || authUser.email?.split('@')[0] || '');
    }
  }, [profile, authUser]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    const validation = validateCustomerProfileForm({
      displayName,
      defaultAddress,
      defaultCity,
      defaultPinCode,
    });
    setFormErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setIsSaving(true);
    try {
      await onSaveProfile({
        displayName,
        defaultAddress,
        defaultCity,
        defaultPinCode,
      });
      setSaveMessage({
        ok: true,
        text: 'Saved delivery details. Future checkouts and bookings will prefill automatically.',
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('Quota exceeded')
          ? 'Daily database quota reached. Please try again tomorrow.'
          : 'Could not save your delivery details right now. Please try again.';
      setSaveMessage({ ok: false, text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (!authReady) {
    return (
      <section className="py-12 sm:py-16 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-[#EAE4E0] bg-white p-8 sm:p-12 text-center">
          <p className="text-sm text-[#6E5F66]">Checking customer session...</p>
        </div>
      </section>
    );
  }

  if (!authUser) {
    return (
      <section className="py-8 sm:py-12 space-y-8">
        <div className="border-b border-[#EAE4E0] pb-5 sm:pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
            Customer Account
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1E161A]">
            Sign in to kcross india
          </h1>
          <p className="mt-1.5 text-sm text-[#6E5F66] max-w-[60ch]">
            Access your saved beauty wishlist, synced pan-India orders, studio consultations, and
            express checkout address from any device.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Left: Google Sign-In Card */}
          <div className="lg:col-span-6 rounded-2xl border border-[#EAE4E0] bg-white p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Verified Member Access</span>
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-[#1E161A]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-[#5C4F55] leading-relaxed">
                Sign in securely with your Google account. We automatically sync your wishlist and
                save your order history privately to your customer profile.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-[#F5C2C7] bg-[#FDF2F2] p-3.5 text-xs text-[#842029]"
                >
                  {authError}
                </div>
              )}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={onSignInWithGoogle}
                  disabled={isSigningIn}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-[#1E161A] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#352A30] disabled:opacity-60"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.3H12z"
                    />
                  </svg>
                  <span>{isSigningIn ? 'Opening Google Sign-In...' : 'Continue with Google'}</span>
                </button>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-[#F3EFEC] space-y-3">
              <p className="text-xs text-[#6E5F66]">
                Prefer guest shopping? You can browse, checkout, or check an existing order ID
                anytime without signing in.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onNavigateView('track-order')}
                  className="inline-flex items-center gap-1 text-[#C41E68] hover:underline"
                >
                  <span>Track Guest Order</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('catalog')}
                  className="inline-flex items-center gap-1 text-[#1E161A] hover:text-[#C41E68]"
                >
                  <span>Browse Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <PWAInstallButton variant="compact" />
              </div>
            </div>
          </div>

          {/* Right: Editorial Member Benefits */}
          <div className="lg:col-span-6 rounded-2xl bg-[#1E161A] text-[#FAF8F6] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F29EC2]">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Inside Your Member Profile</span>
              </div>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium">
                One profile across online &amp; flagship studios.
              </h2>

              <div className="mt-6 space-y-5">
                <div className="border-t border-white/15 pt-4 flex items-start gap-3">
                  <Heart className="h-4 w-4 text-[#F29EC2] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-white">
                      Synced Beauty Wishlist
                    </h3>
                    <p className="mt-0.5 text-xs text-[#D6CBD0] leading-relaxed">
                      Save cleansers, serums, salon haircare, and fragrances across your phone,
                      tablet, and computer.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/15 pt-4 flex items-start gap-3">
                  <Package className="h-4 w-4 text-[#F29EC2] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-white">
                      Order History &amp; Express Delivery Details
                    </h3>
                    <p className="mt-0.5 text-xs text-[#D6CBD0] leading-relaxed">
                      Store your default street address, city, and PIN code for one-tap checkout
                      prefill and instant order lookup.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/15 pt-4 flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-[#F29EC2] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-white">
                      Studio Consultations
                    </h3>
                    <p className="mt-0.5 text-xs text-[#D6CBD0] leading-relaxed">
                      Keep all Bandra West, Lower Parel, Khan Market, Indiranagar &amp; Jubilee
                      Hills appointments organized in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 pt-4 border-t border-white/15 text-xs text-[#D6CBD0]">
              Protected by private owner-only account storage · No mobile number required.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const initials = (profile?.displayName || authUser.displayName || authUser.email || 'K')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="py-8 sm:py-10 space-y-8">
      {/* Header + Sign Out */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE4E0] pb-6">
        <div className="flex items-center gap-4 min-w-0">
          {authUser.photoURL ? (
            <img
              src={authUser.photoURL}
              alt={profile?.displayName || authUser.displayName || 'Customer avatar'}
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-xl object-cover border border-[#EAE4E0] shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-[#1E161A] text-white flex items-center justify-center font-display text-xl font-medium shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
              Customer Account
            </p>
            <h1 className="mt-0.5 font-display text-2xl sm:text-3xl font-medium text-[#1E161A] truncate">
              {profile?.displayName || authUser.displayName || 'kcross Customer'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E5F66] truncate">{authUser.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D8D0CB] bg-white px-4 py-2.5 text-xs font-semibold text-[#1E161A] transition-colors hover:border-[#1E161A]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Quick Account Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#EAE4E0] bg-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#6E5F66]">Synced Orders</span>
            <p className="mt-1 font-display text-2xl font-medium text-[#1E161A] tabular-nums">
              {orders.length}
            </p>
          </div>
          <Package className="h-5 w-5 text-[#C41E68]" aria-hidden="true" />
        </div>

        <div className="rounded-xl border border-[#EAE4E0] bg-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#6E5F66]">Studio Appointments</span>
            <p className="mt-1 font-display text-2xl font-medium text-[#1E161A] tabular-nums">
              {bookings.length}
            </p>
          </div>
          <Calendar className="h-5 w-5 text-[#C41E68]" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={() => onNavigateView('wishlist')}
          className="rounded-xl border border-[#EAE4E0] bg-white p-4 sm:p-5 flex items-center justify-between text-left transition-colors hover:border-[#C41E68]"
        >
          <div>
            <span className="text-xs text-[#6E5F66]">Saved Wishlist</span>
            <p className="mt-1 font-display text-2xl font-medium text-[#1E161A] tabular-nums">
              {wishlistCount} items
            </p>
          </div>
          <Heart className="h-5 w-5 text-[#C41E68]" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Saved Delivery Address Form */}
        <div className="lg:col-span-5 rounded-2xl border border-[#EAE4E0] bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Express Checkout Profile</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-medium text-[#1E161A]">
            Delivery Details
          </h2>
          <p className="mt-1 text-xs text-[#6E5F66]">
            Used to prefill shipping details at checkout. Stored privately to your account.
          </p>

          {saveMessage && (
            <div
              role="status"
              className={`mt-4 rounded-xl border p-3 text-xs flex items-start gap-2 ${
                saveMessage.ok
                  ? 'border-[#C6DFCB] bg-[#F3FAF5] text-[#1E462A]'
                  : 'border-[#F5C2C7] bg-[#FDF2F2] text-[#842029]'
              }`}
            >
              {saveMessage.ok && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />}
              <span>{saveMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold text-[#1E161A] mb-1">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3 py-2.5 text-sm text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
              />
              {formErrors.displayName && (
                <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.displayName}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-address" className="block text-xs font-semibold text-[#1E161A] mb-1">
                Default Street Address
              </label>
              <textarea
                id="prof-address"
                rows={2}
                value={defaultAddress}
                onChange={(e) => setDefaultAddress(e.target.value)}
                placeholder="Flat / House No., Building, Street"
                className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3 py-2 text-sm text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
              />
              {formErrors.defaultAddress && (
                <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.defaultAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-city" className="block text-xs font-semibold text-[#1E161A] mb-1">
                  City
                </label>
                <input
                  id="prof-city"
                  type="text"
                  value={defaultCity}
                  onChange={(e) => setDefaultCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3 py-2.5 text-sm text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
                />
                {formErrors.defaultCity && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.defaultCity}</p>
                )}
              </div>

              <div>
                <label htmlFor="prof-pin" className="block text-xs font-semibold text-[#1E161A] mb-1">
                  PIN Code
                </label>
                <input
                  id="prof-pin"
                  type="text"
                  value={defaultPinCode}
                  onChange={(e) => setDefaultPinCode(e.target.value)}
                  placeholder="400050"
                  className="w-full rounded-lg border border-[#EAE4E0] bg-[#FAF8F6] px-3 py-2.5 text-sm font-mono-num text-[#1E161A] focus:border-[#C41E68] focus:outline-none"
                />
                {formErrors.defaultPinCode && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.defaultPinCode}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-lg bg-[#C41E68] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A61757] disabled:opacity-60"
            >
              {isSaving ? 'Saving Profile...' : 'Save Delivery Profile'}
            </button>
          </form>
        </div>

        {/* Orders & Studio Appointments */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#EAE4E0] bg-white p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-medium text-[#1E161A]">Recent Orders</h2>
              <button
                type="button"
                onClick={() => onNavigateView('catalog')}
                className="text-xs font-semibold text-[#C41E68] hover:underline"
              >
                Shop Catalog →
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-sm text-[#6E5F66] py-4">
                No orders yet. Add skincare, haircare, or fragrances to your bag to place your
                first order.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 6).map((ord) => (
                  <div
                    key={ord.orderNumber}
                    className="rounded-xl border border-[#EAE4E0] bg-[#FAF8F6] p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#6E5F66]">
                        <span className="font-mono-num font-bold text-[#1E161A]">
                          {ord.orderNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#C41E68]">{ord.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ord.paymentMethod}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#5C4F55] line-clamp-1">
                        {ord.items.map((it) => it.name).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-[#1E161A] tabular-nums">
                        {formatINR(ord.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onTrackOrder(ord.orderNumber)}
                        className="rounded-lg border border-[#1E161A] px-3 py-1.5 text-xs font-semibold text-[#1E161A] hover:bg-[#1E161A] hover:text-white transition-colors"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#EAE4E0] bg-white p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-medium text-[#1E161A]">
                Studio Appointments
              </h2>
              <button
                type="button"
                onClick={() => onNavigateView('services')}
                className="text-xs font-semibold text-[#C41E68] hover:underline"
              >
                Book Consultation →
              </button>
            </div>

            {bookings.length === 0 ? (
              <p className="text-sm text-[#6E5F66] py-4">
                No upcoming consultations booked yet. Reserve a complimentary skin, shade-match, or
                fragrance session at our studios.
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-[#EAE4E0] bg-[#FAF8F6] p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#6E5F66]">
                        <span className="font-mono-num font-semibold text-[#1E161A]">{b.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#2E6F40]">{b.status}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#1E161A]">{b.serviceName}</p>
                      <p className="text-xs text-[#6E5F66]">{b.storeName}</p>
                    </div>
                    <div className="sm:text-right text-xs tabular-nums">
                      <p className="font-semibold text-[#1E161A]">{b.date}</p>
                      <p className="text-[#6E5F66]">{b.timeSlot}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
