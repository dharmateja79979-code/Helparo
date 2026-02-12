import { supabaseAdmin } from "../lib/supabase.js";

export const listAddressesForUser = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const createAddressForUser = async (input: {
  userId: string;
  label: string;
  line1: string;
  line2?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  zoneId?: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("addresses")
    .insert({
      user_id: input.userId,
      label: input.label,
      line1: input.line1,
      line2: input.line2 ?? null,
      landmark: input.landmark ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      zone_id: input.zoneId ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
