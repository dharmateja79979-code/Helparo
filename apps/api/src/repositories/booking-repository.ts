import { randomUUID } from "crypto";
import { supabaseAdmin } from "../lib/supabase.js";
import type { BookingStatus } from "../services/booking-status-service.js";

export const createBooking = async (input: {
  customerId: string;
  categoryId: string;
  addressId: string;
  scheduledAt?: string | null;
  notes?: string;
  priceEstimateMin?: number;
  priceEstimateMax?: number;
}) => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      customer_id: input.customerId,
      category_id: input.categoryId,
      address_id: input.addressId,
      scheduled_at: input.scheduledAt ?? null,
      notes: input.notes ?? null,
      status: "requested",
      price_estimate_min: input.priceEstimateMin ?? null,
      price_estimate_max: input.priceEstimateMax ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const listBookingsForUser = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .or(`customer_id.eq.${userId},helper_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const getBookingById = async (bookingId: string) => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const assignBookingToHelper = async (bookingId: string, helperId: string) => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ helper_id: helperId, status: "accepted" })
    .eq("id", bookingId)
    .eq("status", "requested")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const updateBookingStatus = async (bookingId: string, toStatus: BookingStatus) => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .update({ status: toStatus })
    .eq("id", bookingId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const insertBookingEvent = async (input: {
  bookingId: string;
  actorId: string;
  type: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  payload?: Record<string, unknown>;
}) => {
  const { error } = await supabaseAdmin.from("booking_events").insert({
    booking_id: input.bookingId,
    actor_id: input.actorId,
    type: input.type,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus ?? null,
    payload: input.payload ?? {}
  });
  if (error) throw error;
};

export const insertMessage = async (input: { bookingId: string; senderId: string; body: string }) => {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      booking_id: input.bookingId,
      sender_id: input.senderId,
      body: input.body
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const listBookingTimeline = async (bookingId: string) => {
  const [eventsRes, messagesRes, mediaRes, paymentsRes] = await Promise.all([
    supabaseAdmin
      .from("booking_events")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("booking_media")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true })
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (messagesRes.error) throw messagesRes.error;
  if (mediaRes.error) throw mediaRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  return {
    events: eventsRes.data ?? [],
    messages: messagesRes.data ?? [],
    media: mediaRes.data ?? [],
    payments: paymentsRes.data ?? []
  };
};

export const createReview = async (input: {
  bookingId: string;
  customerId: string;
  helperId: string;
  rating: number;
  comment?: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert({
      booking_id: input.bookingId,
      customer_id: input.customerId,
      helper_id: input.helperId,
      rating: input.rating,
      comment: input.comment ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const createMediaSignedUploadUrl = async (bucket: string, bookingId: string, fileName: string) => {
  const path = `${bookingId}/${randomUUID()}-${fileName}`;
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw error ?? new Error("Cannot create signed upload url");
  return { path, token: data.token, signedUrl: data.signedUrl };
};

export const insertBookingMedia = async (input: {
  bookingId: string;
  uploaderId: string;
  type: "before" | "after" | "issue";
  storagePath: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("booking_media")
    .insert({
      booking_id: input.bookingId,
      uploader_id: input.uploaderId,
      type: input.type,
      storage_path: input.storagePath
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const getBookingMediaById = async (bookingId: string, mediaId: string) => {
  const { data, error } = await supabaseAdmin
    .from("booking_media")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("id", mediaId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createSignedReadUrl = async (bucket: string, path: string, expiresIn = 3600) => {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) throw error ?? new Error("Cannot create signed read url");
  return data.signedUrl;
};

export const createPaymentRecord = async (input: {
  bookingId: string;
  method: "cash" | "upi" | "cashfree";
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  providerRef?: string;
  metadata?: Record<string, unknown>;
}) => {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .insert({
      booking_id: input.bookingId,
      method: input.method,
      status: input.status,
      amount: input.amount,
      provider_ref: input.providerRef ?? null,
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const getPaymentByProviderRef = async (providerRef: string) => {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("provider_ref", providerRef)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const updatePaymentStatusByProviderRef = async (
  providerRef: string,
  status: "pending" | "paid" | "failed" | "refunded",
  metadata?: Record<string, unknown>
) => {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .update({
      status,
      metadata: metadata ?? {}
    })
    .eq("provider_ref", providerRef)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getPaymentById = async (paymentId: string) => {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const updatePaymentEscrowById = async (input: {
  paymentId: string;
  escrowStatus: "held" | "released" | "refunded";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  metadata?: Record<string, unknown>;
}) => {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    escrow_status: input.escrowStatus
  };
  if (input.escrowStatus === "held") payload.escrow_held_at = now;
  if (input.escrowStatus === "released") payload.escrow_released_at = now;
  if (input.paymentStatus) payload.status = input.paymentStatus;
  if (input.metadata) payload.metadata = input.metadata;

  const { data, error } = await supabaseAdmin
    .from("payments")
    .update(payload)
    .eq("id", input.paymentId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};
