import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import {
  addCorporateMember,
  cancelActiveSubscriptions,
  createAiEstimate,
  createCorporateAccount,
  createCorporateBooking,
  createDispute,
  createUserSubscription,
  getActiveSubscription,
  getDisputeById,
  getPlanByCode,
  isCorporateMember,
  listCorporateMembers,
  listCorporateBookingsForUser,
  listDisputes,
  resolveDispute,
  setUserPlan
} from "../repositories/advanced-features-repository.js";
import {
  getBookingById,
  getPaymentById,
  updatePaymentEscrowById
} from "../repositories/booking-repository.js";

const ensureBookingAccess = async (bookingId: string, userId: string) => {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.customer_id !== userId && booking.helper_id !== userId) {
    throw new ForbiddenError("Cannot access this booking");
  }
  return booking;
};

export const raiseDisputeFlow = async (input: {
  bookingId: string;
  raisedBy: string;
  reason: string;
  evidence?: string[];
}) => {
  await ensureBookingAccess(input.bookingId, input.raisedBy);
  return createDispute(input);
};

export const listDisputesFlow = async () => listDisputes();

export const resolveDisputeFlow = async (input: {
  disputeId: string;
  status: "resolved" | "rejected" | "investigating";
  resolutionNote?: string;
  resolvedBy: string;
}) => {
  const existing = await getDisputeById(input.disputeId);
  if (!existing) throw new NotFoundError("Dispute not found");
  const updated = await resolveDispute(input);
  if (!updated) throw new NotFoundError("Dispute not found");
  return updated;
};

export const subscribePremiumFlow = async (input: {
  userId: string;
  planCode: string;
  providerRef?: string;
}) => {
  const plan = await getPlanByCode(input.planCode);
  if (!plan) throw new NotFoundError("Plan not found");
  await cancelActiveSubscriptions(input.userId);
  const sub = await createUserSubscription({
    userId: input.userId,
    planId: plan.id as string,
    providerRef: input.providerRef
  });
  await setUserPlan({
    userId: input.userId,
    plan: "premium"
  });
  return sub;
};

export const getMySubscriptionFlow = async (userId: string) => getActiveSubscription(userId);

export const cancelPremiumFlow = async (input: { userId: string; reason?: string }) => {
  await cancelActiveSubscriptions(input.userId);
  await setUserPlan({
    userId: input.userId,
    plan: "free"
  });
  return { cancelled: true, reason: input.reason ?? null };
};

export const createCorporateAccountFlow = async (input: {
  name: string;
  city?: string;
  createdBy: string;
}) => createCorporateAccount(input);

export const createCorporateBookingFlow = async (input: {
  corporateId: string;
  bookingId: string;
  requestedBy: string;
  costCenter?: string;
}) => {
  const membership = await isCorporateMember(input.corporateId, input.requestedBy);
  if (!membership) throw new ForbiddenError("Only corporate members can map bookings");

  const booking = await getBookingById(input.bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.customer_id !== input.requestedBy) {
    throw new ForbiddenError("Only booking owner can map to corporate account");
  }

  return createCorporateBooking(input);
};

export const listCorporateBookingsFlow = async (userId: string) =>
  listCorporateBookingsForUser(userId);

const assertCanManageCorporate = async (corporateId: string, actorId: string) => {
  const membership = await isCorporateMember(corporateId, actorId);
  if (!membership) throw new ForbiddenError("Not a corporate member");
  const role = (membership.role ?? "member") as string;
  if (!["owner", "manager"].includes(role)) {
    throw new ForbiddenError("Only owner/manager can manage members");
  }
};

export const addCorporateMemberFlow = async (input: {
  corporateId: string;
  actorId: string;
  userId: string;
  role: "owner" | "manager" | "member";
}) => {
  await assertCanManageCorporate(input.corporateId, input.actorId);
  return addCorporateMember({
    corporateId: input.corporateId,
    userId: input.userId,
    role: input.role
  });
};

export const listCorporateMembersFlow = async (input: {
  corporateId: string;
  actorId: string;
}) => {
  const membership = await isCorporateMember(input.corporateId, input.actorId);
  if (!membership) throw new ForbiddenError("Not a corporate member");
  return listCorporateMembers(input.corporateId);
};

export const createAiEstimateFlow = async (input: {
  bookingId?: string;
  requestedBy: string;
  inputMedia: string[];
  prompt?: string;
}) => {
  if (input.bookingId) {
    await ensureBookingAccess(input.bookingId, input.requestedBy);
  }
  return createAiEstimate(input);
};

export const setPaymentEscrowFlow = async (input: {
  paymentId: string;
  action: "hold" | "release" | "refund";
  note?: string;
}) => {
  const payment = await getPaymentById(input.paymentId);
  if (!payment) throw new NotFoundError("Payment not found");

  if (input.action === "hold") {
    if (payment.escrow_status !== "na") {
      throw new ForbiddenError("Escrow already initiated");
    }
    return updatePaymentEscrowById({
      paymentId: input.paymentId,
      escrowStatus: "held",
      metadata: {
        ...(payment.metadata ?? {}),
        escrow_action: "hold",
        note: input.note ?? null
      }
    });
  }

  if (input.action === "release") {
    if (payment.escrow_status !== "held") {
      throw new ForbiddenError("Escrow must be held before release");
    }
    return updatePaymentEscrowById({
      paymentId: input.paymentId,
      escrowStatus: "released",
      metadata: {
        ...(payment.metadata ?? {}),
        escrow_action: "release",
        note: input.note ?? null
      }
    });
  }

  if (payment.escrow_status === "released") {
    throw new ForbiddenError("Cannot refund released escrow");
  }
  return updatePaymentEscrowById({
    paymentId: input.paymentId,
    escrowStatus: "refunded",
    paymentStatus: "refunded",
    metadata: {
      ...(payment.metadata ?? {}),
      escrow_action: "refund",
      note: input.note ?? null
    }
  });
};
