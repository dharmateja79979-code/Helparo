import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelPremiumFlow,
  createCorporateBookingFlow,
  setPaymentEscrowFlow
} from "../src/services/advanced-feature-service.js";

vi.mock("../src/repositories/advanced-features-repository.js", () => ({
  addCorporateMember: vi.fn(),
  cancelActiveSubscriptions: vi.fn(),
  createAiEstimate: vi.fn(),
  createCorporateAccount: vi.fn(),
  createCorporateBooking: vi.fn(),
  createDispute: vi.fn(),
  createUserSubscription: vi.fn(),
  getActiveSubscription: vi.fn(),
  getDisputeById: vi.fn(),
  getPlanByCode: vi.fn(),
  isCorporateMember: vi.fn(),
  listCorporateMembers: vi.fn(),
  listCorporateBookingsForUser: vi.fn(),
  listDisputes: vi.fn(),
  resolveDispute: vi.fn(),
  setUserPlan: vi.fn()
}));

vi.mock("../src/repositories/booking-repository.js", () => ({
  getBookingById: vi.fn(),
  getPaymentById: vi.fn(),
  updatePaymentEscrowById: vi.fn()
}));

import * as advancedRepo from "../src/repositories/advanced-features-repository.js";
import * as bookingRepo from "../src/repositories/booking-repository.js";

describe("advanced feature service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels premium and downgrades plan", async () => {
    await cancelPremiumFlow({ userId: "u1", reason: "no longer needed" });

    expect(advancedRepo.cancelActiveSubscriptions).toHaveBeenCalledWith("u1");
    expect(advancedRepo.setUserPlan).toHaveBeenCalledWith({
      userId: "u1",
      plan: "free"
    });
  });

  it("rejects corporate booking mapping for non-member", async () => {
    vi.mocked(advancedRepo.isCorporateMember).mockResolvedValue(null);

    await expect(
      createCorporateBookingFlow({
        corporateId: "corp-1",
        bookingId: "book-1",
        requestedBy: "u1"
      })
    ).rejects.toThrow("Only corporate members can map bookings");
  });

  it("rejects corporate booking mapping if requester is not booking owner", async () => {
    vi.mocked(advancedRepo.isCorporateMember).mockResolvedValue({
      id: "m1",
      role: "member"
    });
    vi.mocked(bookingRepo.getBookingById).mockResolvedValue({
      id: "book-1",
      customer_id: "another-user",
      helper_id: "h1"
    });

    await expect(
      createCorporateBookingFlow({
        corporateId: "corp-1",
        bookingId: "book-1",
        requestedBy: "u1"
      })
    ).rejects.toThrow("Only booking owner can map to corporate account");
  });

  it("holds escrow when payment is in na status", async () => {
    vi.mocked(bookingRepo.getPaymentById).mockResolvedValue({
      id: "p1",
      escrow_status: "na",
      metadata: {}
    });
    vi.mocked(bookingRepo.updatePaymentEscrowById).mockResolvedValue({
      id: "p1",
      escrow_status: "held"
    });

    const result = await setPaymentEscrowFlow({
      paymentId: "p1",
      action: "hold",
      note: "hold for dispute window"
    });

    expect(bookingRepo.updatePaymentEscrowById).toHaveBeenCalled();
    expect(result).toEqual({ id: "p1", escrow_status: "held" });
  });

  it("rejects release if escrow is not held", async () => {
    vi.mocked(bookingRepo.getPaymentById).mockResolvedValue({
      id: "p1",
      escrow_status: "na",
      metadata: {}
    });

    await expect(
      setPaymentEscrowFlow({
        paymentId: "p1",
        action: "release"
      })
    ).rejects.toThrow("Escrow must be held before release");
  });

  it("rejects refund if escrow already released", async () => {
    vi.mocked(bookingRepo.getPaymentById).mockResolvedValue({
      id: "p1",
      escrow_status: "released",
      metadata: {}
    });

    await expect(
      setPaymentEscrowFlow({
        paymentId: "p1",
        action: "refund"
      })
    ).rejects.toThrow("Cannot refund released escrow");
  });
});
