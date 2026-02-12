import { AppError } from "../lib/errors.js";

export type BookingStatus =
  | "requested"
  | "accepted"
  | "enroute"
  | "started"
  | "completed"
  | "paid"
  | "cancelled";

const transitions: Record<BookingStatus, BookingStatus[]> = {
  requested: ["accepted", "cancelled"],
  accepted: ["enroute", "cancelled"],
  enroute: ["started", "cancelled"],
  started: ["completed", "cancelled"],
  completed: ["paid"],
  paid: [],
  cancelled: []
};

export const assertStatusTransition = (from: BookingStatus, to: BookingStatus): void => {
  if (from === to) return;
  if (!transitions[from].includes(to)) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition booking from ${from} to ${to}`,
      409
    );
  }
};

export const reliabilityDeltaForTransition = (from: BookingStatus, to: BookingStatus): number => {
  if (from !== "requested" && to === "cancelled") return -8;
  if (to === "completed") return 4;
  return 0;
};
