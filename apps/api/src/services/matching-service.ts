export type HelperCandidate = {
  id: string;
  distanceKm: number;
  ratingAvg: number;
  ratingCount: number;
  reliabilityScore: number;
  basePrice: number;
  isAvailable: boolean;
};

export type MatchingInput = {
  preferredPriceMin?: number;
  preferredPriceMax?: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const normalizeDistance = (distanceKm: number): number => clamp(1 - distanceKm / 20, 0, 1);

const normalizeRating = (ratingAvg: number, ratingCount: number): number => {
  const avg = clamp(ratingAvg / 5, 0, 1);
  const confidence = clamp(Math.log10(ratingCount + 1) / 2, 0, 1);
  return avg * confidence;
};

const normalizeReliability = (score: number): number => clamp(score / 100, 0, 1);

const normalizePriceFit = (basePrice: number, min?: number, max?: number): number => {
  if (typeof min !== "number" || typeof max !== "number" || min > max) return 0.5;
  if (basePrice >= min && basePrice <= max) return 1;
  const span = Math.max(max - min, 1);
  const delta = basePrice < min ? min - basePrice : basePrice - max;
  return clamp(1 - delta / span, 0, 1);
};

export const scoreHelper = (
  helper: HelperCandidate,
  input: MatchingInput
): number => {
  const w1 = 0.35;
  const w2 = 0.2;
  const w3 = 0.25;
  const w4 = 0.1;
  const w5 = 0.1;
  const availability = helper.isAvailable ? 1 : 0;
  return (
    w1 * normalizeDistance(helper.distanceKm) +
    w2 * normalizeRating(helper.ratingAvg, helper.ratingCount) +
    w3 * normalizeReliability(helper.reliabilityScore) +
    w4 * normalizePriceFit(helper.basePrice, input.preferredPriceMin, input.preferredPriceMax) +
    w5 * availability
  );
};

export const rankHelpers = (helpers: HelperCandidate[], input: MatchingInput): HelperCandidate[] =>
  helpers
    .map((helper) => ({ helper, score: scoreHelper(helper, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ helper }) => helper);
