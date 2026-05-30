import React from "react";

/*
  Zodiac (Rashi) icons — clean Unicode-symbol icons rendered inside a
  coloured gradient circle. Replaces the older cropped PNG poster slices
  that looked half-cut on the page. Always renders crisp at any size and
  centres the symbol perfectly.
*/

export const ZODIAC_COLORS = [
  "#F97316", // 1 Aries — vivid orange (fire)
  "#10B981", // 2 Taurus — emerald (earth)
  "#3B82F6", // 3 Gemini — blue (air)
  "#A78BFA", // 4 Cancer — soft violet (water)
  "#EAB308", // 5 Leo — gold (fire)
  "#22C55E", // 6 Virgo — green (earth)
  "#06B6D4", // 7 Libra — cyan (air)
  "#DC2626", // 8 Scorpio — red (water/intense)
  "#F59E0B", // 9 Sagittarius — amber (fire)
  "#0EA5E9", // 10 Capricorn — sky (earth)
  "#8B5CF6", // 11 Aquarius — violet (air)
  "#14B8A6", // 12 Pisces — teal (water)
];

export const ZODIAC_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const ZODIAC_SYMBOLS = [
  "\u2648", // ♈ Aries
  "\u2649", // ♉ Taurus
  "\u264A", // ♊ Gemini
  "\u264B", // ♋ Cancer
  "\u264C", // ♌ Leo
  "\u264D", // ♍ Virgo
  "\u264E", // ♎ Libra
  "\u264F", // ♏ Scorpio
  "\u2650", // ♐ Sagittarius
  "\u2651", // ♑ Capricorn
  "\u2652", // ♒ Aquarius
  "\u2653", // ♓ Pisces
];

const BaseIcon = ({ idx, size = 80, className = "" }) => {
  const i = Math.max(0, Math.min(11, idx));
  const color = ZODIAC_COLORS[i];
  const symbol = ZODIAC_SYMBOLS[i];
  const fontPx = Math.round(size * 0.58);
  return (
    <span
      role="img"
      aria-label={ZODIAC_NAMES[i]}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: `radial-gradient(circle at 30% 30%, ${color}33, ${color}10 70%, transparent)`,
        border: `1.5px solid ${color}55`,
        boxShadow: `0 4px 18px -8px ${color}88, inset 0 0 14px ${color}22`,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          fontSize: fontPx,
          color: color,
          fontWeight: 600,
          textShadow: `0 0 12px ${color}66`,
          lineHeight: 1,
          // Keep the glyph from looking clipped on any browser:
          paddingBottom: Math.max(2, Math.round(size * 0.03)),
          fontFamily:
            '"Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols2", "Symbola", sans-serif',
        }}
      >
        {symbol}
      </span>
    </span>
  );
};

export const AriesIcon       = (p) => <BaseIcon idx={0}  {...p} />;
export const TaurusIcon      = (p) => <BaseIcon idx={1}  {...p} />;
export const GeminiIcon      = (p) => <BaseIcon idx={2}  {...p} />;
export const CancerIcon      = (p) => <BaseIcon idx={3}  {...p} />;
export const LeoIcon         = (p) => <BaseIcon idx={4}  {...p} />;
export const VirgoIcon       = (p) => <BaseIcon idx={5}  {...p} />;
export const LibraIcon       = (p) => <BaseIcon idx={6}  {...p} />;
export const ScorpioIcon     = (p) => <BaseIcon idx={7}  {...p} />;
export const SagittariusIcon = (p) => <BaseIcon idx={8}  {...p} />;
export const CapricornIcon   = (p) => <BaseIcon idx={9}  {...p} />;
export const AquariusIcon    = (p) => <BaseIcon idx={10} {...p} />;
export const PiscesIcon      = (p) => <BaseIcon idx={11} {...p} />;

export const ZODIAC_ICONS = [
  AriesIcon, TaurusIcon, GeminiIcon, CancerIcon,
  LeoIcon, VirgoIcon, LibraIcon, ScorpioIcon,
  SagittariusIcon, CapricornIcon, AquariusIcon, PiscesIcon,
];

/* Helper: render the icon for a 1-based rashi number (1=Aries .. 12=Pisces). */
export const RashiIcon = ({ rashi = 1, size = 80, className = "" }) => {
  const idx = Math.max(0, Math.min(11, (rashi || 1) - 1));
  return <BaseIcon idx={idx} size={size} className={className} />;
};

export default RashiIcon;
