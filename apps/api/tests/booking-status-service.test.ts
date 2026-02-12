import { describe, expect, it } from "vitest";
import {
  assertStatusTransition,
  reliabilityDeltaForTransition
} from "../src/services/booking-status-service.js";

describe("booking status transitions", () => {
  it("allows valid transitions", () => {
    expect(() => assertStatusTransition("accepted", "enroute")).not.toThrow();
  });

  it("rejects invalid transitions", () => {
    expect(() => assertStatusTransition("requested", "completed")).toThrowError(
      /Cannot transition/
    );
  });

  it("returns reliability deltas", () => {
    expect(reliabilityDeltaForTransition("started", "completed")).toBe(4);
    expect(reliabilityDeltaForTransition("accepted", "cancelled")).toBe(-8);
  });
});
