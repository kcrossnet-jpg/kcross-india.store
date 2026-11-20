import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  LogOut,
  Mail,
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
import {
  formatINR,
  validateCustomerProfileForm,
  validateEmail,
  validateEmailAuthForm,
} from '../utils/storeLogic';
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
  onSignInWithMicrosoft: () => void;
  onSignInWithApple: () => void;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailRegister: (fullName: string, email: string, password: string) => Promise<void>;
  onSendPasswordReset: (email: string) => Promise<boolean>;
  onClearAuthError: () => void;
  onSignOut: () => void;
  onSaveProfile: (data: {
    displayName: string;
    email?: string;
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
  onSignInWithMicrosoft,
  onSignInWithApple,
  onEmailSignIn,
  onEmailRegister,
  onSendPasswordReset,
  onClearAuthError,
  onSignOut,
  onSaveProfile,
  onNavigateView,
  onTrackOrder,
}) => {
  // Email ID sign-in / registration UI state
  const [emailMode, setEmailMode] = useState<'signin' | 'register'>('signin');
  const [emailFullName, setEmailFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);

  // Authenticated delivery profile state
  const [displayName, setDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [defaultCity, setDefaultCity] = useState('');
  const [defaultPinCode, setDefaultPinCode] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || authUser?.displayName || '');
      setProfileEmail(profile.email || authUser?.email || '');
      setDefaultAddress(profile.defaultAddress || '');
      setDefaultCity(profile.defaultCity || '');
      setDefaultPinCode(profile.defaultPinCode || '');
    } else if (authUser) {
      setDisplayName(authUser.displayName || authUser.email?.split('@')[0] || '');
      setProfileEmail(authUser.email || '');
    }
  }, [profile, authUser]);

  const switchEmailMode = (next: 'signin' | 'register') => {
    setEmailMode(next);
    setEmailErrors({});
    setResetSentMessage(null);
    onClearAuthError();
  };



  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSentMessage(null);
    const errors = validateEmailAuthForm(emailMode, {
      fullName: emailFullName,
      email: emailInput,
      password: passwordInput,
    });
    setEmailErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (emailMode === 'signin') {
      await onEmailSignIn(emailInput, passwordInput);
    } else {
      await onEmailRegister(emailFullName, emailInput, passwordInput);
    }
  };

  const handleForgotPassword = async () => {
    setResetSentMessage(null);
    onClearAuthError();
    if (!validateEmail(emailInput)) {
      setEmailErrors((prev) => ({
        ...prev,
        email: 'Enter your registered email ID first to receive a password reset link.',
      }));
      return;
    }
    setEmailErrors({});
    const ok = await onSendPasswordReset(emailInput);
    if (ok) {
      setResetSentMessage(
        `Password reset link sent to ${emailInput.trim()}. Check your inbox to set a new password.`
      );
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    const validation = validateCustomerProfileForm({
      displayName,
      email: profileEmail,
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
        email: profileEmail,
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
        <div className="rounded-2xl border border-[#EAE1D8] bg-white p-8 sm:p-12 text-center">
          <p className="text-sm text-[#6E6058]">Checking customer session...</p>
        </div>
      </section>
    );
  }

  if (!authUser) {
    return (
      <section className="py-8 sm:py-12 space-y-8">
        <div className="border-b border-[#EAE1D8] pb-5 sm:pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            Customer Account
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-medium text-[#1C1613]">
            Login or Register
          </h1>
          <p className="mt-1.5 text-sm text-[#6E6058] max-w-[62ch]">
            Sign in or create an account with your Email ID, or continue with Google, Microsoft,
            or Apple.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Left: Login / Register Card */}
          <div className="lg:col-span-6 rounded-2xl border border-[#EAE1D8] bg-white p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Member Access</span>
              </span>

              {authError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-[#F5C2C7] bg-[#FDF2F2] p-3.5 text-xs text-[#842029]"
                >
                  {authError}
                </div>
              )}

              {/* Email ID Sign In / Register */}
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#F3ECE4] pb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1613]">
                    <Mail className="h-3.5 w-3.5 text-[#C2410C]" aria-hidden="true" />
                    <span>
                      {emailMode === 'signin'
                        ? 'Sign in with Email ID'
                        : 'Register with Email ID'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => switchEmailMode(emailMode === 'signin' ? 'register' : 'signin')}
                    className="text-xs font-semibold text-[#C2410C] hover:underline"
                  >
                    {emailMode === 'signin' ? 'Create Account' : 'Existing user? Sign In'}
                  </button>
                </div>

                {resetSentMessage && (
                  <div
                    role="status"
                    className="rounded-xl border border-[#C6DFCB] bg-[#F3FAF5] p-3 text-xs text-[#1E462A]"
                  >
                    {resetSentMessage}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} noValidate className="space-y-3.5">
                  {emailMode === 'register' && (
                    <div>
                      <label
                        htmlFor="auth-email-name"
                        className="block text-xs font-semibold text-[#1C1613] mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        id="auth-email-name"
                        type="text"
                        autoComplete="name"
                        value={emailFullName}
                        onChange={(e) => setEmailFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                      />
                      {emailErrors.fullName && (
                        <p className="mt-1 text-xs text-[#B91C1C]">{emailErrors.fullName}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block text-xs font-semibold text-[#1C1613] mb-1"
                    >
                      Email ID
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                    />
                    {emailErrors.email && (
                      <p className="mt-1 text-xs text-[#B91C1C]">{emailErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="auth-password"
                        className="block text-xs font-semibold text-[#1C1613]"
                      >
                        Password
                      </label>
                      {emailMode === 'signin' && (
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={isSigningIn}
                          className="text-[11px] font-semibold text-[#C2410C] hover:underline disabled:opacity-60"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={
                          emailMode === 'signin' ? 'current-password' : 'new-password'
                        }
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] pl-3 pr-10 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6E6058] hover:text-[#1C1613]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {emailErrors.password && (
                      <p className="mt-1 text-xs text-[#B91C1C]">{emailErrors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full rounded-lg bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:opacity-60"
                  >
                    {isSigningIn
                      ? emailMode === 'signin'
                        ? 'Signing In...'
                        : 'Creating Account...'
                      : emailMode === 'signin'
                      ? 'Sign In with Email ID'
                      : 'Create Account'}
                  </button>
                </form>
              </div>

              {/* Divider + Social Sign-In (Google, Microsoft, Apple) */}
              <div className="mt-6">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-[#EAE1D8]" />
                  <span className="mx-3 text-[11px] font-medium uppercase tracking-wider text-[#8A7B72]">
                    or continue with
                  </span>
                  <div className="flex-grow border-t border-[#EAE1D8]" />
                </div>

                <div className="mt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={onSignInWithGoogle}
                    disabled={isSigningIn}
                    className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-[#D8CEC4] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C1613] transition-colors hover:border-[#1C1613] hover:bg-[#FCF9F5] disabled:opacity-60"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.3H12z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={onSignInWithMicrosoft}
                    disabled={isSigningIn}
                    className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-[#D8CEC4] bg-white px-5 py-2.5 text-sm font-semibold text-[#1C1613] transition-colors hover:border-[#1C1613] hover:bg-[#FCF9F5] disabled:opacity-60"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23" aria-hidden="true">
                      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                    </svg>
                    <span>Continue with Microsoft</span>
                  </button>

                  <button
                    type="button"
                    onClick={onSignInWithApple}
                    disabled={isSigningIn}
                    className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-[#1C1613] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#332924] disabled:opacity-60"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
                    </svg>
                    <span>Continue with Apple</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-5 border-t border-[#F3ECE4] space-y-3">
              <p className="text-xs text-[#6E6058]">
                Prefer guest shopping? You can browse, checkout, or check an existing order ID
                anytime without signing in.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => onNavigateView('track-order')}
                  className="inline-flex items-center gap-1 text-[#C2410C] hover:underline"
                >
                  <span>Track Guest Order</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('catalog')}
                  className="inline-flex items-center gap-1 text-[#1C1613] hover:text-[#C2410C]"
                >
                  <span>Browse Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <PWAInstallButton variant="compact" />
              </div>
            </div>
          </div>

          {/* Right: Editorial Member Benefits */}
          <div className="lg:col-span-6 rounded-2xl bg-[#1C1613] text-[#FCF9F5] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FDBA74]">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Inside Your Member Profile</span>
              </div>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium">
                One profile across online &amp; flagship studios.
              </h2>

              <div className="mt-6 space-y-5">
                <div className="border-t border-white/15 pt-4 flex items-start gap-3">
                  <Heart className="h-4 w-4 text-[#FDBA74] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-white">
                      Synced Beauty Wishlist
                    </h3>
                    <p className="mt-0.5 text-xs text-[#DDD3CC] leading-relaxed">
                      Save cleansers, serums, salon haircare, and fragrances across your phone,
                      tablet, and computer.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/15 pt-4 flex items-start gap-3">
                  <Package className="h-4 w-4 text-[#FDBA74] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-white">
                      Order History &amp; Express Delivery Details
                    </h3>
                    <p className="mt-0.5 text-xs text-[#DDD3CC] leading-relaxed">
                      Store your default street address, city, and PIN code for one-tap checkout
                      prefill and instant order lookup.
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/15 pt-4 flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-[#FDBA74] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-white">
                      Studio Consultations
                    </h3>
                    <p className="mt-0.5 text-xs text-[#DDD3CC] leading-relaxed">
                      Keep all Bandra West, Lower Parel, Khan Market, Indiranagar &amp; Jubilee
                      Hills appointments organized in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 pt-4 border-t border-white/15 text-xs text-[#DDD3CC]">
              Sign in with Email ID, Google, Microsoft, or Apple · Protected by private owner-only
              account storage.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const primaryIdentifier = authUser.email || profile?.email || '';
  const initials = (
    profile?.displayName ||
    authUser.displayName ||
    authUser.email ||
    'K'
  )
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="py-8 sm:py-10 space-y-8">

      {/* Header + Sign Out */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE1D8] pb-6">
        <div className="flex items-center gap-4 min-w-0">
          {authUser.photoURL ? (
            <img
              src={authUser.photoURL}
              alt={profile?.displayName || authUser.displayName || 'Customer avatar'}
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-xl object-cover border border-[#EAE1D8] shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-[#1C1613] text-white flex items-center justify-center font-display text-xl font-medium shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
              Customer Account
            </p>
            <h1 className="mt-0.5 font-display text-2xl sm:text-3xl font-medium text-[#1C1613] truncate">
              {profile?.displayName || authUser.displayName || 'kcross india store Customer'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6058] truncate">{primaryIdentifier}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D8CEC4] bg-white px-4 py-2.5 text-xs font-semibold text-[#1C1613] transition-colors hover:border-[#1C1613]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Quick Account Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#EAE1D8] bg-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#6E6058]">Synced Orders</span>
            <p className="mt-1 font-display text-2xl font-medium text-[#1C1613] tabular-nums">
              {orders.length}
            </p>
          </div>
          <Package className="h-5 w-5 text-[#C2410C]" aria-hidden="true" />
        </div>

        <div className="rounded-xl border border-[#EAE1D8] bg-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#6E6058]">Studio Appointments</span>
            <p className="mt-1 font-display text-2xl font-medium text-[#1C1613] tabular-nums">
              {bookings.length}
            </p>
          </div>
          <Calendar className="h-5 w-5 text-[#C2410C]" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={() => onNavigateView('wishlist')}
          className="rounded-xl border border-[#EAE1D8] bg-white p-4 sm:p-5 flex items-center justify-between text-left transition-colors hover:border-[#C2410C]"
        >
          <div>
            <span className="text-xs text-[#6E6058]">Saved Wishlist</span>
            <p className="mt-1 font-display text-2xl font-medium text-[#1C1613] tabular-nums">
              {wishlistCount} items
            </p>
          </div>
          <Heart className="h-5 w-5 text-[#C2410C]" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Saved Delivery Address Form */}
        <div className="lg:col-span-5 rounded-2xl border border-[#EAE1D8] bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Express Checkout Profile</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-medium text-[#1C1613]">
            Delivery Details
          </h2>
          <p className="mt-1 text-xs text-[#6E6058]">
            Used to prefill shipping details at checkout. Stored privately to your account.
          </p>

          {authError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[#F5C2C7] bg-[#FDF2F2] p-3 text-xs text-[#842029]"
            >
              {authError}
            </div>
          )}

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
              <label htmlFor="prof-name" className="block text-xs font-semibold text-[#1C1613] mb-1">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
              />
              {formErrors.displayName && (
                <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.displayName}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-semibold text-[#1C1613] mb-1">
                Email ID
              </label>
              <input
                id="prof-email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="prof-address" className="block text-xs font-semibold text-[#1C1613] mb-1">
                Default Street Address
              </label>
              <textarea
                id="prof-address"
                rows={2}
                value={defaultAddress}
                onChange={(e) => setDefaultAddress(e.target.value)}
                placeholder="Flat / House No., Building, Street"
                className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
              />
              {formErrors.defaultAddress && (
                <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.defaultAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="prof-city" className="block text-xs font-semibold text-[#1C1613] mb-1">
                  City
                </label>
                <input
                  id="prof-city"
                  type="text"
                  value={defaultCity}
                  onChange={(e) => setDefaultCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                />
                {formErrors.defaultCity && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.defaultCity}</p>
                )}
              </div>

              <div>
                <label htmlFor="prof-pin" className="block text-xs font-semibold text-[#1C1613] mb-1">
                  PIN Code
                </label>
                <input
                  id="prof-pin"
                  type="text"
                  value={defaultPinCode}
                  onChange={(e) => setDefaultPinCode(e.target.value)}
                  placeholder="400050"
                  className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm font-mono-num text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                />
                {formErrors.defaultPinCode && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.defaultPinCode}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-lg bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:opacity-60"
            >
              {isSaving ? 'Saving Profile...' : 'Save Delivery Profile'}
            </button>
          </form>
        </div>

        {/* Orders & Studio Appointments */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#EAE1D8] bg-white p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-medium text-[#1C1613]">Recent Orders</h2>
              <button
                type="button"
                onClick={() => onNavigateView('catalog')}
                className="text-xs font-semibold text-[#C2410C] hover:underline"
              >
                Shop Catalog →
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="text-sm text-[#6E6058] py-4">
                No orders yet. Add skincare, haircare, or fragrances to your bag to place your
                first order.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 6).map((ord) => (
                  <div
                    key={ord.orderNumber}
                    className="rounded-xl border border-[#EAE1D8] bg-[#FCF9F5] p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#6E6058]">
                        <span className="font-mono-num font-bold text-[#1C1613]">
                          {ord.orderNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#C2410C]">{ord.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ord.paymentMethod}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#574B44] line-clamp-1">
                        {ord.items.map((it) => it.name).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-bold text-[#1C1613] tabular-nums">
                        {formatINR(ord.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onTrackOrder(ord.orderNumber)}
                        className="rounded-lg border border-[#1C1613] px-3 py-1.5 text-xs font-semibold text-[#1C1613] hover:bg-[#1C1613] hover:text-white transition-colors"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#EAE1D8] bg-white p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl font-medium text-[#1C1613]">
                Studio Appointments
              </h2>
              <button
                type="button"
                onClick={() => onNavigateView('services')}
                className="text-xs font-semibold text-[#C2410C] hover:underline"
              >
                Book Consultation →
              </button>
            </div>

            {bookings.length === 0 ? (
              <p className="text-sm text-[#6E6058] py-4">
                No upcoming consultations booked yet. Reserve a complimentary skin, shade-match, or
                fragrance session at our studios.
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-[#EAE1D8] bg-[#FCF9F5] p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#6E6058]">
                        <span className="font-mono-num font-semibold text-[#1C1613]">{b.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#2E6F40]">{b.status}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#1C1613]">{b.serviceName}</p>
                      <p className="text-xs text-[#6E6058]">{b.storeName}</p>
                    </div>
                    <div className="sm:text-right text-xs tabular-nums">
                      <p className="font-semibold text-[#1C1613]">{b.date}</p>
                      <p className="text-[#6E6058]">{b.timeSlot}</p>
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
