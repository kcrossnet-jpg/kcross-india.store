import React, { useEffect, useState } from 'react';
import { Download, Share2, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

type PlatformTab = 'android' | 'ios';

interface MobileAppGuideModalProps {
  isOpen: boolean;
  initialTab: PlatformTab;
  isInstallable: boolean;
  onTriggerNativeInstall: () => Promise<boolean>;
  onClose: () => void;
}

const MobileAppGuideModal: React.FC<MobileAppGuideModalProps> = ({
  isOpen,
  initialTab,
  isInstallable,
  onTriggerNativeInstall,
  onClose,
}) => {
  const [tab, setTab] = useState<PlatformTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1E161A]/50 p-0 sm:p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-app-guide-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-[#EAE4E0] bg-white p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C41E68]">
              kcross india store Mobile App
            </p>
            <h2
              id="mobile-app-guide-title"
              className="mt-1 font-display text-2xl font-medium text-[#1E161A]"
            >
              Get kcross india store on Android &amp; iOS
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close mobile app install guide"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EAE4E0] text-[#1E161A] hover:bg-[#FAF8F6] shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-[#EFEBE8] p-1">
          <button
            type="button"
            onClick={() => setTab('android')}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === 'android'
                ? 'bg-white text-[#1E161A] shadow-xs'
                : 'text-[#6E5F66] hover:text-[#1E161A]'
            }`}
          >
            Android / Play Store
          </button>
          <button
            type="button"
            onClick={() => setTab('ios')}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === 'ios'
                ? 'bg-white text-[#1E161A] shadow-xs'
                : 'text-[#6E5F66] hover:text-[#1E161A]'
            }`}
          >
            iPhone &amp; iPad (iOS)
          </button>
        </div>

        {tab === 'android' ? (
          <div className="mt-5 space-y-3 text-sm text-[#4A3F45]">
            <p className="text-xs leading-relaxed text-[#5C4F55]">
              Install kcross india store directly onto your Android device via Google Play WebAPK
              instant install for offline catalog access and express checkout.
            </p>
            <ol className="space-y-2 rounded-xl border border-[#EAE4E0] bg-[#FAF8F6] p-4 text-xs text-[#1E161A]">
              <li>1. Tap <strong>Install Android App</strong> below or open the Chrome menu (⋮).</li>
              <li>2. Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              <li>3. Launch kcross india store from your Android app drawer just like a Play Store app.</li>
            </ol>
            {isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  const ok = await onTriggerNativeInstall();
                  if (ok) onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#C41E68] px-4 py-3 text-xs font-semibold text-white hover:bg-[#A61757]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Install Android App Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-3 text-sm text-[#4A3F45]">
            <p className="text-xs leading-relaxed text-[#5C4F55]">
              Add kcross india store to your iPhone or iPad Home Screen for full-screen iOS app mode,
              Face ID/Google sync, and offline browsing.
            </p>
            <ol className="space-y-2 rounded-xl border border-[#EAE4E0] bg-[#FAF8F6] p-4 text-xs text-[#1E161A]">
              <li className="flex items-start gap-2">
                <Share2 className="h-3.5 w-3.5 text-[#C41E68] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  1. Open this store in <strong>Safari</strong> and tap the{' '}
                  <strong>Share</strong> button in the bottom toolbar.
                </span>
              </li>
              <li>2. Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>3. Tap <strong>Add</strong> in the top-right corner to launch the iOS app.</li>
            </ol>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-[#EAE4E0] bg-white py-2.5 text-xs font-semibold text-[#1E161A] hover:border-[#1E161A]"
        >
          Done
        </button>
      </div>
    </div>
  );
};

interface PWAInstallButtonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'default',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setGuideOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#1E161A] bg-white px-3.5 py-2 text-xs font-semibold text-[#1E161A] transition-colors hover:bg-[#1E161A] hover:text-white whitespace-nowrap ${className}`}
      >
        {isInstallable ? (
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
        <span>
          {variant === 'compact'
            ? isIOS
              ? 'Install on iOS'
              : 'Install App'
            : 'Install Mobile App (Android & iOS)'}
        </span>
      </button>

      <MobileAppGuideModal
        isOpen={guideOpen}
        initialTab={isIOS ? 'ios' : 'android'}
        isInstallable={isInstallable}
        onTriggerNativeInstall={install}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
};

export const AppStoreFooterBadges: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [modalPlatform, setModalPlatform] = useState<PlatformTab | null>(null);

  const handlePlayStoreClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setModalPlatform('android');
  };

  return (
    <>
      <div className="pt-2 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1E161A]">
          Available on Google Play &amp; iOS
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePlayStoreClick}
            aria-label="Get kcross india store on Google Play for Android"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E161A] px-3 py-2 text-left text-white transition-colors hover:bg-[#352A30]"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#34A853"
                d="M3.6 2.3C3.2 2.7 3 3.3 3 4v16c0 .7.2 1.3.6 1.7l.1.1 9-9v-.2l-9-9-.1.1z"
              />
              <path
                fill="#FBBC04"
                d="M15.7 15.8l-3-3v-.2l3-3 .1.1 3.5 2c1 .6 1 1.5 0 2.1l-3.5 2-.1 0z"
              />
              <path
                fill="#EA4335"
                d="M15.8 15.7l-3.1-3.1-9.1 9.1c.3.3.9.4 1.6 0l10.6-6z"
              />
              <path
                fill="#4285F4"
                d="M15.8 8.3L5.2 2.3c-.7-.4-1.3-.3-1.6 0l9.1 9.1 3.1-3.1z"
              />
            </svg>
            <span className="leading-tight">
              <span className="block text-[9px] uppercase tracking-wider text-white/75">
                {isInstalled ? 'Installed on' : 'Get it on'}
              </span>
              <span className="block text-xs font-semibold whitespace-nowrap">Google Play</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalPlatform('ios')}
            aria-label="Download kcross india store for iOS iPhone and iPad"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E161A] px-3 py-2 text-left text-white transition-colors hover:bg-[#352A30]"
          >
            <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
            </svg>
            <span className="leading-tight">
              <span className="block text-[9px] uppercase tracking-wider text-white/75">
                Available on
              </span>
              <span className="block text-xs font-semibold whitespace-nowrap">App Store · iOS</span>
            </span>
          </button>
        </div>
      </div>

      <MobileAppGuideModal
        isOpen={modalPlatform !== null}
        initialTab={modalPlatform ?? 'android'}
        isInstallable={isInstallable}
        onTriggerNativeInstall={install}
        onClose={() => setModalPlatform(null)}
      />
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-lg bg-[#9A3412] px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Offline Mode — Cached catalog active</span>
    </div>
  );
};
