import { supabaseAdmin } from "../lib/supabase.js";

export const setHelperKycStatus = async (
  helperId: string,
  status: "approved" | "rejected",
  isActive = true
) => {
  const { data, error } = await supabaseAdmin
    .from("helper_profiles")
    .update({
      kyc_status: status,
      is_active: isActive
    })
    .eq("user_id", helperId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const suspendHelper = async (helperId: string) => {
  const { data, error } = await supabaseAdmin
    .from("helper_profiles")
    .update({
      is_active: false
    })
    .eq("user_id", helperId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const listAuditLogs = async (limit = 100) => {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
};

export const getCommissionConfig = async () => {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("*")
    .eq("key", "commission")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const setCommissionConfig = async (defaultPercent: number) => {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .upsert({
      key: "commission",
      value: { default_percent: defaultPercent },
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const listCategoriesAdmin = async () => {
  const { data, error } = await supabaseAdmin
    .from("service_categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const createCategoryAdmin = async (input: {
  name: string;
  description?: string;
  iconKey?: string;
  isActive?: boolean;
}) => {
  const { data, error } = await supabaseAdmin
    .from("service_categories")
    .insert({
      name: input.name,
      description: input.description ?? null,
      icon_key: input.iconKey ?? null,
      is_active: input.isActive ?? true
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const updateCategoryAdmin = async (
  id: string,
  input: {
    name?: string;
    description?: string;
    iconKey?: string;
    isActive?: boolean;
  }
) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.iconKey !== undefined) payload.icon_key = input.iconKey;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  const { data, error } = await supabaseAdmin
    .from("service_categories")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const listZonesAdmin = async () => {
  const { data, error } = await supabaseAdmin
    .from("service_zones")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const createZoneAdmin = async (input: {
  name: string;
  city: string;
  country: string;
  polygon?: unknown;
  isActive?: boolean;
}) => {
  const { data, error } = await supabaseAdmin
    .from("service_zones")
    .insert({
      name: input.name,
      city: input.city,
      country: input.country,
      polygon: input.polygon ?? null,
      is_active: input.isActive ?? true
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const updateZoneAdmin = async (
  id: string,
  input: {
    name?: string;
    city?: string;
    country?: string;
    polygon?: unknown;
    isActive?: boolean;
  }
) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.city !== undefined) payload.city = input.city;
  if (input.country !== undefined) payload.country = input.country;
  if (input.polygon !== undefined) payload.polygon = input.polygon;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  const { data, error } = await supabaseAdmin
    .from("service_zones")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const listSubscriptionPlansAdmin = async () => {
  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .select("*")
    .order("code", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const createSubscriptionPlanAdmin = async (input: {
  code: string;
  name: string;
  monthlyPrice: number;
  features: string[];
  isActive?: boolean;
}) => {
  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .insert({
      code: input.code,
      name: input.name,
      monthly_price: input.monthlyPrice,
      features: input.features,
      is_active: input.isActive ?? true
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const updateSubscriptionPlanAdmin = async (
  id: string,
  input: {
    name?: string;
    monthlyPrice?: number;
    features?: string[];
    isActive?: boolean;
  }
) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.monthlyPrice !== undefined) payload.monthly_price = input.monthlyPrice;
  if (input.features !== undefined) payload.features = input.features;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};
