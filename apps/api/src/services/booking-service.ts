import { env } from "../config/env.js";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import {
  assignBookingToHelper,
  createBooking,
  createMediaSignedUploadUrl,
  createSignedReadUrl,
  createPaymentRecord,
  createReview,
  getBookingMediaById,
  getBookingById,
  insertBookingEvent,
  insertBookingMedia,
  insertMessage,
  listBookingTimeline,
  listBookingsForUser,
  updateBookingStatus
} from "../repositories/booking-repository.js";
import { updateHelperReliability } from "../repositories/helper-repository.js";
import {
  assertStatusTransition,
  reliabilityDeltaForTransition,
  type BookingStatus
} from "./booking-status-service.js";
import { notifyUsers } from "./notification-service.js";

export const createBookingFlow = async (input: Parameters<typeof createBooking>[0]) => {
  const booking = await createBooking(input);
  await insertBookingEvent({
    bookingId: booking.id,
    actorId: input.customerId,
    type: "booking.created",
    toStatus: "requested"
  });
  await notifyUsers([input.customerId], {
    title: "Booking requested",
    body: "Your request has been created.",
    data: { bookingId: booking.id, status: "requested" }
  });
  return booking;
};

export const listMyBookings = (userId: string) => listBookingsForUser(userId);

export const getBookingDetails = async (bookingId: string, userId: string) => {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.customer_id !== userId && booking.helper_id !== userId) {
    throw new ForbiddenError("Cannot access this booking");
  }
  return booking;
};

export const getBookingTimeline = async (bookingId: string, userId: string) => {
  await getBookingDetails(bookingId, userId);
  return listBookingTimeline(bookingId);
};

export const acceptBookingFlow = async (bookingId: string, helperId: string) => {
  const booking = await assignBookingToHelper(bookingId, helperId);
  if (!booking) throw new NotFoundError("Booking unavailable for acceptance");
  await insertBookingEvent({
    bookingId,
    actorId: helperId,
    type: "booking.accepted",
    fromStatus: "requested",
    toStatus: "accepted"
  });
  await notifyUsers([helperId, booking.customer_id], {
    title: "Booking accepted",
    body: "Helper has accepted the booking.",
    data: { bookingId, status: "accepted" }
  });
  return booking;
};

export const updateBookingStatusFlow = async (
  bookingId: string,
  actorId: string,
  nextStatus: BookingStatus,
  metadata?: Record<string, unknown>
) => {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  assertStatusTransition(booking.status, nextStatus);

  const updated = await updateBookingStatus(bookingId, nextStatus);
  await insertBookingEvent({
    bookingId,
    actorId,
    type: "booking.status.changed",
    fromStatus: booking.status,
    toStatus: nextStatus,
    payload: metadata ?? {}
  });

  if (updated.helper_id) {
    const delta = reliabilityDeltaForTransition(booking.status, nextStatus);
    if (delta !== 0) {
      await updateHelperReliability(updated.helper_id, delta);
    }
  }
  const recipients = [updated.customer_id as string];
  if (updated.helper_id) recipients.push(updated.helper_id as string);
  await notifyUsers(recipients, {
    title: "Booking status updated",
    body: `Booking moved to ${nextStatus}.`,
    data: { bookingId, status: nextStatus }
  });
  return updated;
};

export const cancelBookingFlow = async (bookingId: string, actorId: string) =>
  updateBookingStatusFlow(bookingId, actorId, "cancelled");

export const declineBookingFlow = async (bookingId: string, helperId: string, reason?: string) => {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.status !== "requested") {
    throw new ForbiddenError("Only requested bookings can be declined");
  }
  await insertBookingEvent({
    bookingId,
    actorId: helperId,
    type: "booking.declined",
    fromStatus: booking.status,
    toStatus: booking.status,
    payload: reason ? { reason } : {}
  });
  return { declined: true, bookingId };
};

export const addMessageFlow = async (bookingId: string, senderId: string, body: string) => {
  const booking = await getBookingDetails(bookingId, senderId);
  if (booking.status === "cancelled") throw new ForbiddenError("Cannot message on cancelled booking");
  const message = await insertMessage({ bookingId, senderId, body });
  const recipients = [booking.customer_id, booking.helper_id].filter(
    (id): id is string => Boolean(id) && id !== senderId
  );
  await notifyUsers(recipients, {
    title: "New message",
    body: body.slice(0, 90),
    data: { bookingId }
  });
  return message;
};

export const addReviewFlow = async (input: {
  bookingId: string;
  customerId: string;
  rating: number;
  comment?: string;
}) => {
  const booking = await getBookingById(input.bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.customer_id !== input.customerId) throw new ForbiddenError("Only customer can review");
  if (booking.status !== "paid") throw new ForbiddenError("Review allowed only after payment");
  if (!booking.helper_id) throw new ForbiddenError("Booking missing helper");

  return createReview({
    bookingId: input.bookingId,
    customerId: input.customerId,
    helperId: booking.helper_id,
    rating: input.rating,
    comment: input.comment
  });
};

export const createMediaUploadFlow = async (input: {
  bookingId: string;
  uploaderId: string;
  type: "before" | "after" | "issue";
  fileName: string;
}) => {
  await getBookingDetails(input.bookingId, input.uploaderId);
  const signed = await createMediaSignedUploadUrl(env.STORAGE_BOOKING_BUCKET, input.bookingId, input.fileName);
  await insertBookingMedia({
    bookingId: input.bookingId,
    uploaderId: input.uploaderId,
    type: input.type,
    storagePath: signed.path
  });
  return signed;
};

export const getMediaReadUrlFlow = async (input: {
  bookingId: string;
  mediaId: string;
  actorId: string;
}) => {
  await getBookingDetails(input.bookingId, input.actorId);
  const media = await getBookingMediaById(input.bookingId, input.mediaId);
  if (!media) throw new NotFoundError("Media not found");
  const signedUrl = await createSignedReadUrl(env.STORAGE_BOOKING_BUCKET, String(media.storage_path), 1800);
  return { mediaId: input.mediaId, signedUrl, expiresInSec: 1800 };
};

export const recordPaymentFlow = async (input: {
  bookingId: string;
  actorId: string;
  method: "cash" | "upi" | "cashfree";
  amount: number;
  providerRef?: string;
  metadata?: Record<string, unknown>;
}) => {
  const booking = await getBookingDetails(input.bookingId, input.actorId);
  if (booking.status !== "completed" && booking.status !== "paid") {
    throw new ForbiddenError("Payment can be recorded only after completion");
  }

  const payment = await createPaymentRecord({
    bookingId: input.bookingId,
    method: input.method,
    amount: input.amount,
    status: "paid",
    providerRef: input.providerRef,
    metadata: input.metadata
  });

  if (booking.status !== "paid") {
    await updateBookingStatusFlow(input.bookingId, input.actorId, "paid", {
      paymentId: payment.id
    });
  }
  return payment;
};
