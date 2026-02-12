import { describe, expect, it } from "vitest";
import { rankHelpers } from "../src/services/matching-service.js";

describe("matching service", () => {
  it("ranks helpers by score descending", () => {
    const ranked = rankHelpers(
      [
        {
          id: "a",
          distanceKm: 12,
          ratingAvg: 4.8,
          ratingCount: 220,
          reliabilityScore: 92,
          basePrice: 400,
          isAvailable: true
        },
        {
          id: "b",
          distanceKm: 2,
          ratingAvg: 3.2,
          ratingCount: 1,
          reliabilityScore: 45,
          basePrice: 900,
          isAvailable: false
        }
      ],
      { preferredPriceMin: 300, preferredPriceMax: 450 }
    );

    expect(ranked[0]?.id).toBe("a");
    expect(ranked).toHaveLength(2);
  });
});
