import { env } from "../config/env.js";
import { firebaseMessagingOrNull } from "../lib/firebase-admin.js";
import { listDeviceTokensByUserIds } from "../repositories/device-repository.js";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

const chunk = (items: string[], size: number): string[][] => {
  const out: string[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
};

const sendFcmV1 = async (tokens: string[], payload: PushPayload): Promise<void> => {
  if (!env.FCM_ENABLED || !firebaseMessagingOrNull || tokens.length === 0) return;

  const batches = chunk(tokens, 500);
  for (const tokenBatch of batches) {
    await firebaseMessagingOrNull.sendEachForMulticast({
      tokens: tokenBatch,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data ?? {}
    });
  }
};

export const notifyUsers = async (userIds: string[], payload: PushPayload): Promise<void> => {
  const devices = await listDeviceTokensByUserIds(userIds);
  const tokens = Array.from(new Set(devices.map((d) => d.token)));
  await sendFcmV1(tokens, payload);
};
