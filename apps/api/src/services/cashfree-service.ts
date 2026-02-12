import { createHmac, randomUUID } from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import {
  createPaymentRecord,
  getPaymentByProviderRef,
  getBookingById,
  updatePaymentStatusByProviderRef
} from "../repositories/booking-repository.js";
import { updateBookingStatusFlow } from "./booking-service.js";

type CashfreeOrderResponse = {
  cf_order_id: string;
  payment_session_id: string;
  order_id: string;
};

const assertCashfreeEnabled = () => {
  if (!env.CASHFREE_ENABLED || !env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) {
    throw new AppError("CASHFREE_DISABLED", "Cashfree is not configured", 400);
  }
};

export const createCashfreeOrder = async (input: {
  bookingId: string;
  actorId: string;
  amount: number;
  customerPhone?: string | null;
  customerEmail?: string | null;
}) => {
  assertCashfreeEnabled();
  const booking = await getBookingById(input.bookingId);
  if (!booking) throw new AppError("NOT_FOUND", "Booking not found", 404);

  const orderId = `hlp_${input.bookingId.replaceAll("-", "").slice(0, 12)}_${Date.now()}`;
  const customerId = booking.customer_id;

  const response = await fetch(`${env.CASHFREE_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": env.CASHFREE_APP_ID!,
      "x-client-secret": env.CASHFREE_SECRET_KEY!
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: input.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_phone: input.customerPhone ?? "9999999999",
        customer_email: input.customerEmail ?? "customer@helparo.app"
      },
      order_meta: {
        return_url: env.CASHFREE_RETURN_URL
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError("CASHFREE_ORDER_ERROR", "Failed to create Cashfree order", 502, body);
  }
  const payload = (await response.json()) as CashfreeOrderResponse;

  await createPaymentRecord({
    bookingId: input.bookingId,
    method: "cashfree",
    status: "pending",
    amount: input.amount,
    providerRef: payload.cf_order_id,
    metadata: { orderId: payload.order_id, source: "cashfree" }
  });

  return {
    orderId: payload.order_id,
    cfOrderId: payload.cf_order_id,
    paymentSessionId: payload.payment_session_id
  };
};

export const verifyCashfreeWebhookSignature = (rawBody: string, signatureHeader?: string): boolean => {
  if (!env.CASHFREE_WEBHOOK_SECRET) return false;
  if (!signatureHeader) return false;
  const computed = createHmac("sha256", env.CASHFREE_WEBHOOK_SECRET).update(rawBody).digest("base64");
  return computed === signatureHeader;
};

export const handleCashfreeWebhook = async (payload: any) => {
  const cfOrderId = payload?.data?.order?.cf_order_id as string | undefined;
  const orderStatus = payload?.data?.payment?.payment_status as string | undefined;
  const paymentId = payload?.data?.payment?.cf_payment_id as string | undefined;
  if (!cfOrderId || !orderStatus) {
    throw new AppError("WEBHOOK_INVALID", "Invalid webhook payload", 400);
  }

  const mappedStatus =
    orderStatus === "SUCCESS" ? "paid" : orderStatus === "FAILED" ? "failed" : "pending";

  const existing = await getPaymentByProviderRef(cfOrderId);
  if (!existing) return { processed: false, reason: "unknown_provider_ref" };

  if (existing.status === mappedStatus) {
    return { processed: true, idempotent: true };
  }

  const updated = await updatePaymentStatusByProviderRef(cfOrderId, mappedStatus, {
    webhookPaymentId: paymentId ?? randomUUID(),
    rawStatus: orderStatus
  });

  if (updated && mappedStatus === "paid") {
    const booking = await getBookingById(updated.booking_id as string);
    const actorId = booking?.customer_id ?? booking?.helper_id;
    if (booking?.status === "completed" && actorId) {
      await updateBookingStatusFlow(updated.booking_id as string, actorId, "paid", {
        providerRef: cfOrderId
      });
    }
  }
  return { processed: true, paymentId: updated?.id };
};
