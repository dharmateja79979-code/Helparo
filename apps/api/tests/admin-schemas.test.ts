import { describe, expect, it } from "vitest";
import {
  commissionConfigSchema,
  createCategorySchema,
  createSubscriptionPlanSchema,
  createZoneSchema
} from "../src/schemas/admin-schemas.js";

describe("admin schemas", () => {
  it("validates commission update payload", () => {
    const parsed = commissionConfigSchema.parse({ defaultPercent: 15 });
    expect(parsed.defaultPercent).toBe(15);
  });

  it("validates category payload", () => {
    const parsed = createCategorySchema.parse({
      name: "Painting",
      description: "Home painting",
      iconKey: "paint",
      isActive: true
    });
    expect(parsed.name).toBe("Painting");
  });

  it("validates zone payload", () => {
    const parsed = createZoneSchema.parse({
      name: "BTM Layout",
      city: "Bangalore",
      country: "India"
    });
    expect(parsed.city).toBe("Bangalore");
  });

  it("validates subscription plan payload", () => {
    const parsed = createSubscriptionPlanSchema.parse({
      code: "premium_plus",
      name: "Premium Plus",
      monthlyPrice: 499,
      features: ["priority_matching"]
    });
    expect(parsed.code).toBe("premium_plus");
  });
});
