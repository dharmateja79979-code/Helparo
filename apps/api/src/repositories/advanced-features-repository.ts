import { supabaseAdmin } from "../lib/supabase.js";

export const createDispute = async (input: {
  bookingId: string;
  raisedBy: string;
  reason: string;
  evidence?: string[];
}) => {
  const { data, error } = await supabaseAdmin
    .from("disputes")
    .insert({
      booking_id: input.bookingId,
      raised_by: input.raisedBy,
      reason: input.reason,
      evidence: input.evidence ?? []
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const listDisputes = async () => {
  const { data, error } = await supabaseAdmin
    .from("disputes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const getDisputeById = async (disputeId: string) => {
  const { data, error } = await supabaseAdmin
    .from("disputes")
    .select("*")
    .eq("id", disputeId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const resolveDispute = async (input: {
  disputeId: string;
  status: "resolved" | "rejected" | "investigating";
  resolutionNote?: string;
  resolvedBy: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("disputes")
    .update({
      status: input.status,
      resolution_note: input.resolutionNote ?? null,
      resolved_by: input.resolvedBy
    })
    .eq("id", input.disputeId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getPlanByCode = async (code: string) => {
  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createUserSubscription = async (input: {
  userId: string;
  planId: string;
  providerRef?: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("user_subscriptions")
    .insert({
      user_id: input.userId,
      plan_id: input.planId,
      provider_ref: input.providerRef ?? null,
      status: "active"
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const cancelActiveSubscriptions = async (userId: string) => {
  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: "cancelled",
      ends_at: new Date().toISOString()
    })
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw error;
};

export const setUserPlan = async (input: {
  userId: string;
  plan: "free" | "premium";
}) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ user_plan: input.plan })
    .eq("id", input.userId)
    .select("id, user_plan")
    .single();
  if (error) throw error;
  return data;
};

export const getActiveSubscription = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("user_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createCorporateAccount = async (input: {
  name: string;
  city?: string;
  createdBy: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("corporate_accounts")
    .insert({
      name: input.name,
      city: input.city ?? null,
      created_by: input.createdBy
    })
    .select("*")
    .single();
  if (error) throw error;

  const { error: memberError } = await supabaseAdmin.from("corporate_members").insert({
    corporate_id: data.id,
    user_id: input.createdBy,
    role: "owner"
  });
  if (memberError) throw memberError;
  return data;
};

export const createCorporateBooking = async (input: {
  corporateId: string;
  bookingId: string;
  requestedBy: string;
  costCenter?: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("corporate_bookings")
    .insert({
      corporate_id: input.corporateId,
      booking_id: input.bookingId,
      requested_by: input.requestedBy,
      cost_center: input.costCenter ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const listCorporateBookingsForUser = async (userId: string) => {
  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from("corporate_members")
    .select("corporate_id")
    .eq("user_id", userId);
  if (membershipError) throw membershipError;
  const corporateIds = (memberships ?? []).map((m) => m.corporate_id as string);
  if (corporateIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("corporate_bookings")
    .select("*, corporate_accounts(*), bookings(*)")
    .in("corporate_id", corporateIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const isCorporateMember = async (corporateId: string, userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("corporate_members")
    .select("id, role")
    .eq("corporate_id", corporateId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const listCorporateMembers = async (corporateId: string) => {
  const { data, error } = await supabaseAdmin
    .from("corporate_members")
    .select("*, users(id, name, email, phone)")
    .eq("corporate_id", corporateId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const addCorporateMember = async (input: {
  corporateId: string;
  userId: string;
  role: "owner" | "manager" | "member";
}) => {
  const { data, error } = await supabaseAdmin
    .from("corporate_members")
    .upsert(
      {
        corporate_id: input.corporateId,
        user_id: input.userId,
        role: input.role
      },
      { onConflict: "corporate_id,user_id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const createAiEstimate = async (input: {
  bookingId?: string;
  requestedBy: string;
  inputMedia: string[];
  prompt?: string;
}) => {
  const result = {
    confidence: 0.61,
    estimated_min_price: 400,
    estimated_max_price: 950,
    estimated_minutes: 75,
    suggested_tools: ["gloves", "inspection kit"],
    note: input.prompt ?? "Advanced estimate stub result"
  };
  const { data, error } = await supabaseAdmin
    .from("ai_issue_estimates")
    .insert({
      booking_id: input.bookingId ?? null,
      requested_by: input.requestedBy,
      input_media: input.inputMedia,
      result,
      status: "completed"
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
