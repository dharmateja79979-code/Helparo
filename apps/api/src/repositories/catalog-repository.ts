import { supabaseAdmin } from "../lib/supabase.js";

export const listActiveCategories = async () => {
  const { data, error } = await supabaseAdmin
    .from("service_categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const listActiveZones = async () => {
  const { data, error } = await supabaseAdmin
    .from("service_zones")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
};
