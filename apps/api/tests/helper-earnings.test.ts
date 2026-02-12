import { describe, expect, it } from "vitest";
import { computeHelperEarningsSummary } from "../src/services/earnings-service.js";

describe("helper earnings summary", () => {
  it("computes weekly/monthly totals and job count", () => {
    const now = new Date("2026-02-12T10:00:00.000Z");
    const summary = computeHelperEarningsSummary(
      [
        { final_price: 500, created_at: "2026-02-10T10:00:00.000Z" },
        { final_price: 1200, created_at: "2026-01-20T10:00:00.000Z" },
        { final_price: 300, created_at: "2025-11-20T10:00:00.000Z" }
      ],
      now
    );

    expect(summary.week).toBe(500);
    expect(summary.month).toBe(1700);
    expect(summary.totalJobs).toBe(3);
  });
});
