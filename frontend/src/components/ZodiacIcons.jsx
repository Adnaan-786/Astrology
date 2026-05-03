import React from "react";

/* Colourful Vedic zodiac (Rashi) icons taken from the traditional
   12-sign poster (ram, bull, twins, crab, lion, maiden, scales,
   scorpion, archer, sea-goat, water-bearer, fish). Each icon is a
   PNG with a transparent background that carries its signature colour.
   Used by: /rashifal page, NakshatraAI Kundli chart, etc.
*/

export const ZODIAC_COLORS = [
  "#C5C44E", // 1 Aries — yellow-green
  "#C8202C", // 2 Taurus — red
  "#3F77AE", // 3 Gemini — blue
  "#8B3326", // 4 Cancer — brown-red
  "#E26430", // 5 Leo — orange
  "#B83695", // 6 Virgo — magenta
  "#34427D", // 7 Libra — deep blue
  "#2D2A6E", // 8 Scorpio — dark navy
  "#3D5A3A", // 9 Sagittarius — olive green
  "#3A573A", // 10 Capricorn — forest green
  "#2A4286", // 11 Aquarius — royal blue
  "#2A5C66", // 12 Pisces — teal
];

export const ZODIAC_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const ZODIAC_FILES = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

const BaseIcon = ({ idx, size = 80, className = "" }) => {
  const name = ZODIAC_FILES[idx];
  return (
    <img
      src={`/zodiac/${name}.png`}
      alt={ZODIAC_NAMES[idx]}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", width: size, height: size }}
    />
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
