import { supabaseAdmin } from "../lib/supabase.js";

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const updateUserRoleAndProfile = async (input: {
  userId: string;
  role: "customer" | "helper";
  name?: string;
}) => {
  const payload: Record<string, unknown> = {
    role: input.role
  };
  if (input.name) payload.name = input.name;

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(payload)
    .eq("id", input.userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};
