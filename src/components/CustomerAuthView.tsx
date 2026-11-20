import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
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
  Phone,
  RefreshCw,
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
  normalizePhoneNumberWithCountry,
  validateCustomerProfileForm,
  validateEmail,
  validateEmailAuthForm,
  validatePhoneNumberInput,
} from '../utils/storeLogic';
import { PWAInstallButton } from './MobileAppInstall';

const COUNTRY_CODES = [
  { code: '+91', label: '+91 (IN)' },
  { code: '+1', label: '+1 (US/CA)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+971', label: '+971 (UAE)' },
  { code: '+65', label: '+65 (SG)' },
  { code: '+61', label: '+61 (AU)' },
];

interface CustomerAuthViewProps {
  authReady: boolean;
  authUser: User | null;
  isCloudVerified: boolean;
  profile: CustomerProfile | null;
  orders: OrderRecord[];
  bookings: ServiceBooking[];
  wishlistCount: number;
  authError: string | null;
  isSigningIn: boolean;
  pendingPhoneLabel: string | null;
  pendingLinkPhoneLabel: string | null;
  onSignInWithGoogle: () => void;
  onSendPhoneOtp: (
    rawPhone: string,
    recaptchaContainer: HTMLElement | null,
    countryDialCode?: string
  ) => Promise<boolean>;
  onVerifyPhoneOtp: (otpCode: string, optionalName?: string) => Promise<boolean>;
  onResetPhoneOtp: () => void;
  onSendLinkPhoneOtp: (rawPhone: string, recaptchaContainer: HTMLElement | null) => Promise<void>;
  onConfirmLinkPhoneOtp: (otpCode: string) => Promise<boolean>;
  onResetLinkPhoneOtp: () => void;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailRegister: (fullName: string, email: string, password: string) => Promise<void>;
  onSendPasswordReset: (email: string) => Promise<boolean>;
  onResendVerification: () => Promise<void>;
  onRefreshSession: () => Promise<void>;
  onClearAuthError: () => void;
  onSignOut: () => void;
  onSaveProfile: (data: {
    displayName: string;
    email?: string;
    phoneNumber?: string;
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
  isCloudVerified,
  profile,
  orders,
  bookings,
  wishlistCount,
  authError,
  isSigningIn,
  pendingPhoneLabel,
  pendingLinkPhoneLabel,
  onSignInWithGoogle,
  onSendPhoneOtp,
  onVerifyPhoneOtp,
  onResetPhoneOtp,
  onSendLinkPhoneOtp,
  onConfirmLinkPhoneOtp,
  onResetLinkPhoneOtp,
  onEmailSignIn,
  onEmailRegister,
  onSendPasswordReset,
  onResendVerification,
  onRefreshSession,
  onClearAuthError,
  onSignOut,
  onSaveProfile,
  onNavigateView,
  onTrackOrder,
}) => {
  // Unauthenticated sign-in / registration UI state
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email'>('mobile');
  const [emailMode, setEmailMode] = useState<'signin' | 'register'>('signin');

  // Mobile OTP state
  const [countryDialCode, setCountryDialCode] = useState('+91');
  const [mobileInput, setMobileInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpNameInput, setOtpNameInput] = useState('');
  const [mobileFieldError, setMobileFieldError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  // Authenticated phone-link OTP state
  const [linkOtpInput, setLinkOtpInput] = useState('');
  const [linkOtpError, setLinkOtpError] = useState<string | null>(null);
  const linkRecaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  // Email ID login / register state
  const [emailFullName, setEmailFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [resetSentMessage, setResetSentMessage] = useState<string | null>(null);

  // Authenticated delivery profile state
  const [displayName, setDisplayName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [defaultCity, setDefaultCity] = useState('');
  const [defaultPinCode, setDefaultPinCode] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (pendingPhoneLabel) {
      setResendCooldown(30);
    } else {
      setResendCooldown(0);
    }
  }, [pendingPhoneLabel]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || authUser?.displayName || '');
      setProfileEmail(profile.email || authUser?.email || '');
      setProfilePhone(profile.phoneNumber || authUser?.phoneNumber || '');
      setDefaultAddress(profile.defaultAddress || '');
      setDefaultCity(profile.defaultCity || '');
      setDefaultPinCode(profile.defaultPinCode || '');
    } else if (authUser) {
      setDisplayName(
        authUser.displayName || authUser.email?.split('@')[0] || authUser.phoneNumber || ''
      );
      setProfileEmail(authUser.email || '');
      setProfilePhone(authUser.phoneNumber || '');
    }
  }, [profile, authUser]);

  const switchAuthMethod = (next: 'mobile' | 'email') => {
    setAuthMethod(next);
    setMobileFieldError(null);
    setEmailErrors({});
    setResetSentMessage(null);
    onClearAuthError();
  };

  const switchEmailMode = (next: 'signin' | 'register') => {
    setEmailMode(next);
    setEmailErrors({});
    setResetSentMessage(null);
    onClearAuthError();
  };

  const handleMobileOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileFieldError(null);

    if (!pendingPhoneLabel) {
      const err = validatePhoneNumberInput(mobileInput, countryDialCode);
      if (err) {
        setMobileFieldError(err);
        return;
      }
      await onSendPhoneOtp(mobileInput, recaptchaContainerRef.current, countryDialCode);
      return;
    }

    const cleanedOtp = otpInput.replace(/\D/g, '');
    if (cleanedOtp.length !== 6) {
      setMobileFieldError('Enter the 6-digit verification code received via SMS.');
      return;
    }
    const ok = await onVerifyPhoneOtp(cleanedOtp, otpNameInput);
    if (ok) {
      setOtpInput('');
      setOtpNameInput('');
    }
  };

  const handleSendLinkCodeClick = async () => {
    setLinkOtpError(null);
    const normalized = normalizePhoneNumberWithCountry(profilePhone, '+91');
    if (!normalized) {
      setLinkOtpError('Enter a valid 10-digit Indian mobile number (or +country format) first.');
      return;
    }
    await onSendLinkPhoneOtp(normalized, linkRecaptchaContainerRef.current);
  };

  const handleVerifyLinkCodeClick = async () => {
    setLinkOtpError(null);
    const cleaned = linkOtpInput.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setLinkOtpError('Enter the 6-digit SMS code sent to your phone.');
      return;
    }
    const ok = await onConfirmLinkPhoneOtp(cleaned);
    if (ok) {
      setLinkOtpInput('');
    }
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
      phoneNumber: profilePhone,
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
        phoneNumber: profilePhone,
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
          : err instanceof Error && err.message.includes('Verify your Email ID')
          ? err.message
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
            Enter your mobile number to receive a 6-digit SMS verification code, sign in or
            register with your Email ID, or continue with Google.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Left: Login / Register Card */}
          <div className="lg:col-span-6 rounded-2xl border border-[#EAE1D8] bg-white p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Verified Member Access</span>
              </span>

              {/* Primary Method Tabs: Mobile Number vs Email ID */}
              <div
                role="tablist"
                aria-label="Sign-in method"
                className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-[#F4ECE3] p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMethod === 'mobile'}
                  onClick={() => switchAuthMethod('mobile')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                    authMethod === 'mobile'
                      ? 'bg-white text-[#1C1613] shadow-sm'
                      : 'text-[#574B44] hover:text-[#1C1613]'
                  }`}
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Mobile Number</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMethod === 'email'}
                  onClick={() => switchAuthMethod('email')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                    authMethod === 'email'
                      ? 'bg-white text-[#1C1613] shadow-sm'
                      : 'text-[#574B44] hover:text-[#1C1613]'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Email ID</span>
                </button>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-[#F5C2C7] bg-[#FDF2F2] p-3.5 text-xs text-[#842029]"
                >
                  {authError}
                </div>
              )}

              {/* Tab 1: Mobile Number (OTP Login / Register) */}
              {authMethod === 'mobile' && (
                <form onSubmit={handleMobileOtpSubmit} noValidate className="mt-5 space-y-4">
                  {!pendingPhoneLabel ? (
                    <>
                      <div>
                        <label
                          htmlFor="auth-mobile"
                          className="block text-xs font-semibold text-[#1C1613] mb-1.5"
                        >
                          Enter Mobile Number
                        </label>
                        <div className="flex items-stretch rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] focus-within:border-[#C2410C]">
                          <label htmlFor="auth-country-code" className="sr-only">
                            Country code
                          </label>
                          <select
                            id="auth-country-code"
                            value={countryDialCode}
                            onChange={(e) => {
                              setCountryDialCode(e.target.value);
                              setMobileFieldError(null);
                            }}
                            className="rounded-l-lg border-r border-[#EAE1D8] bg-[#F6EFE7] px-2.5 py-2.5 text-xs font-semibold text-[#1C1613] focus:outline-none"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                          <input
                            id="auth-mobile"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel-national"
                            value={mobileInput}
                            onChange={(e) => {
                              setMobileInput(e.target.value);
                              setMobileFieldError(null);
                            }}
                            placeholder={countryDialCode === '+91' ? '98765 43210' : 'Mobile number'}
                            className="w-full rounded-r-lg bg-transparent px-3 py-2.5 text-sm font-mono-num text-[#1C1613] placeholder:text-[#8A7B72] focus:outline-none"
                          />
                        </div>
                        {mobileFieldError ? (
                          <p className="mt-1.5 text-xs text-[#B91C1C]">{mobileFieldError}</p>
                        ) : (
                          <p className="mt-1.5 text-[11px] text-[#6E6058]">
                            We&apos;ll send a 6-digit SMS verification code to sign in or create
                            your account automatically.
                          </p>
                        )}
                      </div>

                      <button
                        id="sign-in-button"
                        type="submit"
                        disabled={isSigningIn}
                        className="w-full rounded-lg bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:opacity-60"
                      >
                        {isSigningIn ? 'Sending Verification Code...' : 'Send Verification Code'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-[#C6DFCB] bg-[#F3FAF5] px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs text-[#1E462A]">
                        <div>
                          <span>SMS code sent to </span>
                          <span className="font-mono-num font-bold text-[#1C1613]">
                            {pendingPhoneLabel}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpInput('');
                            setMobileFieldError(null);
                            onResetPhoneOtp();
                          }}
                          className="font-semibold text-[#C2410C] hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <label
                          htmlFor="auth-otp"
                          className="block text-xs font-semibold text-[#1C1613] mb-1.5"
                        >
                          6-Digit SMS Verification Code
                        </label>
                        <input
                          id="auth-otp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          autoFocus
                          autoComplete="one-time-code"
                          value={otpInput}
                          onChange={(e) => {
                            setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setMobileFieldError(null);
                          }}
                          placeholder="••••••"
                          className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-base tracking-[0.35em] font-mono-num text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                        />
                        {mobileFieldError && (
                          <p className="mt-1 text-xs text-[#B91C1C]">{mobileFieldError}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="auth-otp-name"
                          className="block text-xs font-semibold text-[#1C1613] mb-1.5"
                        >
                          Your Name{' '}
                          <span className="font-normal text-[#6E6058]">
                            (optional for new accounts)
                          </span>
                        </label>
                        <input
                          id="auth-otp-name"
                          type="text"
                          autoComplete="name"
                          value={otpNameInput}
                          onChange={(e) => setOtpNameInput(e.target.value)}
                          placeholder="Aarav Sharma"
                          className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="submit"
                          disabled={isSigningIn}
                          className="flex-1 rounded-lg bg-[#C2410C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:opacity-60"
                        >
                          {isSigningIn ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                        <button
                          type="button"
                          disabled={isSigningIn || resendCooldown > 0}
                          onClick={async () => {
                            const sent = await onSendPhoneOtp(
                              pendingPhoneLabel,
                              recaptchaContainerRef.current,
                              countryDialCode
                            );
                            if (sent) {
                              setResendCooldown(30);
                            }
                          }}
                          className="rounded-lg border border-[#D8CEC4] bg-white px-4 py-3 text-xs font-semibold text-[#1C1613] hover:border-[#1C1613] disabled:opacity-60 tabular-nums"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                        </button>
                      </div>
                    </>
                  )}
                  <div id="recaptcha-container" ref={recaptchaContainerRef} className="min-h-[1px]" />
                </form>
              )}

              {/* Tab 2: Email ID Sign In / Register */}
              {authMethod === 'email' && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F3ECE4] pb-2.5">
                    <span className="text-xs font-semibold text-[#1C1613]">
                      {emailMode === 'signin'
                        ? 'Sign in with Email ID'
                        : 'Register with Email ID'}
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
              )}

              {/* Divider + Google Sign-In */}
              <div className="mt-6">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-[#EAE1D8]" />
                  <span className="mx-3 text-[11px] font-medium uppercase tracking-wider text-[#8A7B72]">
                    or continue with
                  </span>
                  <div className="flex-grow border-t border-[#EAE1D8]" />
                </div>

                <button
                  type="button"
                  onClick={onSignInWithGoogle}
                  disabled={isSigningIn}
                  className="mt-2 w-full inline-flex items-center justify-center gap-3 rounded-lg bg-[#1C1613] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#332924] disabled:opacity-60"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.3H12z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
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
                      Store your mobile number, default street address, city, and PIN code for
                      one-tap checkout prefill and instant order lookup.
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
              Sign in with Mobile OTP, Email ID, or Google · Protected by private owner-only account
              storage.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const primaryIdentifier =
    authUser.email || authUser.phoneNumber || profile?.email || profile?.phoneNumber || '';
  const initials = (
    profile?.displayName ||
    authUser.displayName ||
    authUser.email ||
    authUser.phoneNumber ||
    'K'
  )
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="py-8 sm:py-10 space-y-8">
      {/* Email Verification Pending Prompt */}
      {!isCloudVerified && (
        <div
          role="status"
          className="rounded-2xl border border-[#F5D0A9] bg-[#FFF8F1] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 min-w-0">
            <AlertCircle className="h-5 w-5 text-[#C2410C] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1C1613]">
                Verify your Email ID to enable cloud profile &amp; wishlist sync
              </p>
              <p className="mt-0.5 text-xs text-[#574B44]">
                We sent a verification link to{' '}
                <span className="font-semibold">{authUser.email}</span>. Click it, then refresh
                your session—or verify your mobile number via SMS OTP below.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={onResendVerification}
              className="rounded-lg border border-[#D8CEC4] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C1613] hover:border-[#1C1613] disabled:opacity-60"
            >
              Resend Verification Email
            </button>
            <button
              type="button"
              disabled={isSigningIn}
              onClick={onRefreshSession}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#C2410C] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#9A3412] disabled:opacity-60"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>I&apos;ve Verified — Refresh</span>
            </button>
          </div>
        </div>
      )}

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#1C1613]">
                    Mobile Number
                  </label>
                  {authUser.phoneNumber ? (
                    <span className="text-[11px] font-semibold text-[#1E462A]">OTP Verified</span>
                  ) : (
                    !pendingLinkPhoneLabel && (
                      <button
                        type="button"
                        disabled={isSigningIn}
                        onClick={handleSendLinkCodeClick}
                        className="text-[11px] font-semibold text-[#C2410C] hover:underline disabled:opacity-60"
                      >
                        Send SMS Code
                      </button>
                    )
                  )}
                </div>
                <input
                  id="prof-phone"
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => {
                    setProfilePhone(e.target.value);
                    setLinkOtpError(null);
                  }}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-[#EAE1D8] bg-[#FCF9F5] px-3 py-2.5 text-sm font-mono-num text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                />
                {formErrors.phoneNumber && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{formErrors.phoneNumber}</p>
                )}
                {linkOtpError && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{linkOtpError}</p>
                )}
              </div>
            </div>

            {pendingLinkPhoneLabel && !authUser.phoneNumber && (
              <div className="rounded-xl border border-[#EAE1D8] bg-[#FCF9F5] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#574B44]">
                    Enter SMS code sent to{' '}
                    <span className="font-mono-num font-semibold text-[#1C1613]">
                      {pendingLinkPhoneLabel}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkOtpInput('');
                      setLinkOtpError(null);
                      onResetLinkPhoneOtp();
                    }}
                    className="font-semibold text-[#C2410C] hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex items-stretch gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={linkOtpInput}
                    onChange={(e) => {
                      setLinkOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setLinkOtpError(null);
                    }}
                    placeholder="6-digit OTP"
                    className="flex-1 rounded-lg border border-[#EAE1D8] bg-white px-3 py-2 text-sm font-mono-num text-[#1C1613] focus:border-[#C2410C] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isSigningIn}
                    onClick={handleVerifyLinkCodeClick}
                    className="rounded-lg bg-[#1C1613] px-4 py-2 text-xs font-semibold text-white hover:bg-[#332924] disabled:opacity-60"
                  >
                    {isSigningIn ? 'Verifying...' : 'Verify Phone'}
                  </button>
                </div>
              </div>
            )}
            <div ref={linkRecaptchaContainerRef} className="min-h-[1px]" />

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
