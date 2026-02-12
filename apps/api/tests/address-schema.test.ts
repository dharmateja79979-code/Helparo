import { describe, expect, it } from "vitest";
import { createAddressSchema } from "../src/schemas/address-schemas.js";

describe("createAddressSchema", () => {
  it("accepts valid payload", () => {
    const parsed = createAddressSchema.parse({
      label: "Home",
      line1: "HSR Layout, Bangalore",
      lat: 12.91,
      lng: 77.64
    });
    expect(parsed.label).toBe("Home");
  });

  it("rejects invalid payload", () => {
    expect(() =>
      createAddressSchema.parse({
        label: "",
        line1: "x"
      })
    ).toThrow();
  });
});
