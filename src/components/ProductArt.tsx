import React, { useEffect, useState } from 'react';
import { VisualForm } from '../types/store';

interface ProductArtProps {
  form: VisualForm;
  brand: string;
  surfaceTone: string;
  accentTone: string;
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
}

const BRAND_LABEL_MAP: Record<string, string> = {
  'Charlotte Tilbury': 'TILBURY',
  'Schwarzkopf Professional': 'SCHWARZKOPF',
  'Bath & Body Works': 'B&BW',
  "L'Oréal Professionnel": "L'ORÉAL PRO",
  'Giorgio Armani': 'ARMANI',
  'PAC Cosmetics': 'PAC',
  'Faces Canada': 'FACES',
  'Sugar Cosmetics': 'SUGAR',
  'Alan Truman': 'TRUMAN',
};

export const ProductArt: React.FC<ProductArtProps> = ({
  form,
  brand,
  surfaceTone,
  accentTone,
  imageUrl,
  imageAlt,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const shortBrand = (BRAND_LABEL_MAP[brand] ?? brand.split(' ')[0]).toUpperCase();
  const labelFontSize = shortBrand.length > 8 ? '6.6' : '8.2';

  if (imageUrl && !imageError) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden select-none bg-white ${className}`}
      >
        <img
          src={imageUrl}
          alt={imageAlt || `${brand} product`}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain p-1.5 sm:p-2.5 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  if (form === 'giftcard') {
    const isLightCard = surfaceTone.toUpperCase() === '#FCF9F5';
    const isOrangeCard = accentTone.toUpperCase() === '#9A3412';
    const cardBg = isOrangeCard
      ? 'bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#9A3412] text-white border-[#FDBA74]/50'
      : isLightCard
        ? 'bg-[#FCF9F5] text-[#1C1613] border-[#D8CEC4]'
        : 'bg-gradient-to-br from-[#1C1613] via-[#2B201B] to-[#1C1613] text-[#FCF9F5] border-[#FDBA74]/40';

    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden select-none p-1.5 ${className}`}
        style={{ backgroundColor: surfaceTone }}
        aria-hidden="true"
      >
        <div
          className={`relative w-full h-full rounded-lg border p-1.5 flex flex-col items-center justify-center gap-1 shadow-sm ${cardBg}`}
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-white p-0.5 shadow-sm border border-[#EAE1D8]/80 flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/imgi_5_images_e8c25121.jpg"
              alt="Kcross india"
              className="h-full w-full object-contain"
            />
          </div>
          <span
            className={`text-[7.5px] font-semibold uppercase tracking-[0.16em] leading-none whitespace-nowrap ${
              isLightCard ? 'text-[#C2410C]' : 'text-[#FFF3EB]'
            }`}
          >
            E-GIFT CARD
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden select-none ${className}`}
      style={{ backgroundColor: surfaceTone }}
      aria-hidden="true"
    >
      {/* Subtle studio pedestal floor shadow */}
      <div
        className="absolute bottom-[14%] h-3 w-2/5 rounded-full opacity-15 blur-[3px]"
        style={{ backgroundColor: '#1C1613' }}
      />

      <svg
        viewBox="0 0 180 180"
        className="h-[74%] w-[74%] drop-shadow-[0_6px_14px_rgba(28,22,19,0.08)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {form === 'perfume' && (
          <g>
            {/* Cap */}
            <rect x="74" y="24" width="32" height="22" rx="3" fill="#261E1A" />
            <rect x="81" y="46" width="18" height="8" fill="#B8B2AE" />
            {/* Glass Bottle */}
            <rect x="48" y="54" width="84" height="92" rx="10" fill="#FFFFFF" fillOpacity="0.72" stroke={accentTone} strokeWidth="2.2" />
            <rect x="55" y="62" width="70" height="76" rx="6" fill={accentTone} fillOpacity="0.14" />
            {/* Label */}
            <rect x="61" y="80" width="58" height="36" rx="2" fill="#FFFFFF" stroke={accentTone} strokeOpacity="0.25" strokeWidth="1" />
            <text x="90" y="99" textAnchor="middle" fill="#1C1613" fontSize={labelFontSize} fontWeight="700" letterSpacing="1">
              {shortBrand}
            </text>
            <text x="90" y="109" textAnchor="middle" fill="#6E6058" fontSize="6" letterSpacing="0.8">
              PARFUM
            </text>
          </g>
        )}

        {form === 'serum' && (
          <g>
            {/* Dropper bulb & collar */}
            <path d="M81 26C81 20.5 85 16 90 16C95 16 99 20.5 99 26V40H81V26Z" fill="#261E1A" />
            <rect x="76" y="40" width="28" height="12" rx="2" fill="#D9D2CC" />
            {/* Bottle */}
            <rect x="58" y="52" width="64" height="94" rx="10" fill={accentTone} fillOpacity="0.88" />
            <rect x="65" y="58" width="10" height="80" rx="5" fill="#FFFFFF" fillOpacity="0.18" />
            {/* Label */}
            <rect x="63" y="76" width="54" height="46" rx="3" fill="#FCF9F5" />
            <text x="90" y="96" textAnchor="middle" fill="#1C1613" fontSize={labelFontSize} fontWeight="700" letterSpacing="0.8">
              {shortBrand}
            </text>
            <text x="90" y="108" textAnchor="middle" fill="#6E6058" fontSize="6">
              SERUM
            </text>
          </g>
        )}

        {(form === 'cleanser' || form === 'lotion' || form === 'baby') && (
          <g>
            {/* Pump top */}
            <path d="M74 24H106V30H94V44H86V30H74V24Z" fill="#FFFFFF" stroke={accentTone} strokeWidth="1.5" />
            <rect x="79" y="42" width="22" height="10" rx="2" fill={accentTone} />
            {/* Tall bottle */}
            <rect x="54" y="52" width="72" height="96" rx="14" fill="#FFFFFF" stroke={accentTone} strokeWidth="2" />
            <rect x="60" y="72" width="60" height="54" rx="4" fill={accentTone} fillOpacity="0.14" />
            <text x="90" y="96" textAnchor="middle" fill="#1C1613" fontSize={labelFontSize} fontWeight="700" letterSpacing="0.8">
              {shortBrand}
            </text>
            <text x="90" y="108" textAnchor="middle" fill={accentTone} fontSize="6" fontWeight="600">
              {form === 'baby' ? 'BABY CARE' : form === 'lotion' ? 'DAILY CARE' : 'CLEANSER'}
            </text>
          </g>
        )}

        {(form === 'shampoo' || form === 'mask') && (
          <g>
            {/* Flip cap */}
            <rect x="72" y="26" width="36" height="16" rx="3" fill="#261E1A" />
            {/* Cylindrical bottle */}
            <rect x="56" y="42" width="68" height="106" rx="10" fill="#FFFFFF" stroke={accentTone} strokeWidth="2" />
            <rect x="56" y="64" width="68" height="54" fill={accentTone} fillOpacity="0.16" />
            <text x="90" y="90" textAnchor="middle" fill="#1C1613" fontSize={labelFontSize} fontWeight="700" letterSpacing="0.8">
              {shortBrand}
            </text>
            <text x="90" y="103" textAnchor="middle" fill="#6E6058" fontSize="6" letterSpacing="0.6">
              SALON HAIR
            </text>
          </g>
        )}

        {form === 'jar' && (
          <g>
            {/* Lid */}
            <rect x="46" y="54" width="88" height="22" rx="6" fill={accentTone} />
            {/* Tub */}
            <rect x="48" y="76" width="84" height="68" rx="10" fill="#FFFFFF" stroke={accentTone} strokeWidth="2" />
            <rect x="56" y="90" width="68" height="36" rx="3" fill={accentTone} fillOpacity="0.1" />
            <text x="90" y="108" textAnchor="middle" fill="#1C1613" fontSize={labelFontSize} fontWeight="700" letterSpacing="0.8">
              {shortBrand}
            </text>
            <text x="90" y="119" textAnchor="middle" fill="#6E6058" fontSize="6">
              CREAM
            </text>
          </g>
        )}

        {form === 'lipstick' && (
          <g>
            {/* Bullet */}
            <path d="M76 58L104 38V68H76V58Z" fill={accentTone} />
            {/* Gold / metallic collar */}
            <rect x="72" y="68" width="36" height="26" rx="2" fill="#D5B58A" />
            {/* Base tube */}
            <rect x="68" y="94" width="44" height="54" rx="4" fill="#261E1A" />
            <text x="90" y="124" textAnchor="middle" fill="#FCF9F5" fontSize="6.8" fontWeight="600" letterSpacing="1">
              {shortBrand}
            </text>
          </g>
        )}

        {form === 'concealer' && (
          <g>
            {/* Wand handle */}
            <rect x="76" y="26" width="28" height="38" rx="4" fill="#261E1A" />
            {/* Glass vial */}
            <rect x="71" y="64" width="38" height="84" rx="8" fill={accentTone} fillOpacity="0.72" stroke="#261E1A" strokeWidth="1.5" />
            <rect x="76" y="84" width="28" height="36" rx="2" fill="#FFFFFF" fillOpacity="0.92" />
            <text x="90" y="103" textAnchor="middle" fill="#1C1613" fontSize="7" fontWeight="700">
              {shortBrand}
            </text>
            <text x="90" y="113" textAnchor="middle" fill="#6E6058" fontSize="5.2">
              CONCEALER
            </text>
          </g>
        )}

        {form === 'mist' && (
          <g>
            <rect x="78" y="24" width="24" height="16" rx="3" fill="#D8C2B8" />
            <rect x="60" y="40" width="60" height="108" rx="14" fill={accentTone} fillOpacity="0.22" stroke={accentTone} strokeWidth="2" />
            <rect x="68" y="64" width="44" height="58" rx="4" fill="#FFFFFF" />
            <text x="90" y="91" textAnchor="middle" fill="#1C1613" fontSize="7.5" fontWeight="700">
              {shortBrand}
            </text>
            <text x="90" y="104" textAnchor="middle" fill={accentTone} fontSize="6">
              FINE MIST
            </text>
          </g>
        )}

        {form === 'appliance' && (
          <g>
            {/* Ergonomic styling tool silhouette */}
            <rect x="77" y="24" width="26" height="58" rx="13" fill={accentTone} />
            <rect x="82" y="32" width="16" height="42" rx="8" fill="#FFFFFF" fillOpacity="0.18" />
            <rect x="83" y="82" width="14" height="60" rx="6" fill="#261E1A" />
            <circle cx="90" cy="98" r="3.5" fill="#EA580C" />
            <text x="90" y="128" textAnchor="middle" fill="#FCF9F5" fontSize="6" fontWeight="600" letterSpacing="1">
              PRO TOOL
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
