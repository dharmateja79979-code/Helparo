import { supabaseAdmin } from "../lib/supabase.js";
import { computeHelperEarningsSummary } from "../services/earnings-service.js";

export const listCandidateHelpers = async (categoryId: string, zoneId?: string) => {
  let query = supabaseAdmin
    .from("helper_profiles")
    .select("user_id, rating_avg, rating_count, reliability_score, base_price, services, service_areas, is_active")
    .eq("is_active", true)
    .eq("kyc_status", "approved");

  if (zoneId) {
    query = query.contains("service_areas", [zoneId]);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).filter((row) => Array.isArray(row.services) && row.services.includes(categoryId));
};

export const getHelperProfile = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("helper_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const upsertHelperProfile = async (
  userId: string,
  payload: {
    bio?: string;
    experienceYears?: number;
    services?: string[];
    basePrice?: number;
    serviceAreas?: string[];
  }
) => {
  const { data, error } = await supabaseAdmin
    .from("helper_profiles")
    .upsert(
      {
        user_id: userId,
        bio: payload.bio,
        experience_years: payload.experienceYears,
        services: payload.services,
        base_price: payload.basePrice,
        service_areas: payload.serviceAreas
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const updateHelperReliability = async (userId: string, delta: number) => {
  const { data: current, error: currentError } = await supabaseAdmin
    .from("helper_profiles")
    .select("reliability_score")
    .eq("user_id", userId)
    .single();
  if (currentError) throw currentError;

  const next = Math.max(0, Math.min(100, Number(current.reliability_score ?? 50) + delta));
  const { error } = await supabaseAdmin
    .from("helper_profiles")
    .update({ reliability_score: next })
    .eq("user_id", userId);
  if (error) throw error;
};

export const getHelperEarningsSummary = async (helperId: string) => {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("final_price, status, created_at")
    .eq("helper_id", helperId)
    .in("status", ["completed", "paid"]);
  if (error) throw error;

  const rows = data ?? [];
  return computeHelperEarningsSummary(rows);
};
