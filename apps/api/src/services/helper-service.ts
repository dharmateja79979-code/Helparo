import { getBookingById, listBookingsForUser } from "../repositories/booking-repository.js";
import {
  getHelperEarningsSummary,
  getHelperProfile,
  listCandidateHelpers,
  upsertHelperProfile
} from "../repositories/helper-repository.js";
import { rankHelpers, type HelperCandidate } from "./matching-service.js";
import { NotFoundError } from "../lib/errors.js";
import { supabaseAdmin } from "../lib/supabase.js";

const roughDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dx = lat1 - lat2;
  const dy = lng1 - lng2;
  return Math.sqrt(dx * dx + dy * dy) * 111;
};

export const discoverHelpers = async (input: {
  categoryId: string;
  zoneId?: string;
  lat?: number;
  lng?: number;
  priceMin?: number;
  priceMax?: number;
}) => {
  const candidates = await listCandidateHelpers(input.categoryId, input.zoneId);
  const mapped: HelperCandidate[] = candidates.map((row) => ({
    id: row.user_id,
    distanceKm:
      typeof input.lat === "number" && typeof input.lng === "number"
        ? roughDistanceKm(input.lat, input.lng, 12.9352, 77.6245)
        : 5,
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    reliabilityScore: Number(row.reliability_score ?? 50),
    basePrice: Number(row.base_price ?? 0),
    isAvailable: true
  }));

  return rankHelpers(mapped, {
    preferredPriceMin: input.priceMin,
    preferredPriceMax: input.priceMax
  });
};

export const getHelperMe = async (helperId: string) => {
  const profile = await getHelperProfile(helperId);
  if (!profile) throw new NotFoundError("Helper profile not found");
  return profile;
};

export const updateHelperMe = async (
  helperId: string,
  payload: {
    bio?: string;
    experienceYears?: number;
    services?: string[];
    basePrice?: number;
    serviceAreas?: string[];
  }
) => upsertHelperProfile(helperId, payload);

export const getHelperBookings = (helperId: string) => listBookingsForUser(helperId);

export const saveHelperLocationPing = async (input: {
  helperId: string;
  bookingId: string;
  lat: number;
  lng: number;
  timestamp: string;
}) => {
  const booking = await getBookingById(input.bookingId);
  if (!booking || booking.helper_id !== input.helperId) {
    throw new NotFoundError("Booking not found for helper");
  }

  const { error } = await supabaseAdmin.from("booking_events").insert({
    booking_id: input.bookingId,
    actor_id: input.helperId,
    type: "helper.location.ping",
    payload: {
      lat: input.lat,
      lng: input.lng,
      timestamp: input.timestamp
    }
  });
  if (error) throw error;
};

export const getHelperEarnings = async (helperId: string) => getHelperEarningsSummary(helperId);
