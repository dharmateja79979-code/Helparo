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
