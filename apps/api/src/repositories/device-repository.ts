import { supabaseAdmin } from "../lib/supabase.js";

export const registerUserDevice = async (userId: string, platform: "android" | "ios" | "web", fcmToken: string) => {
  const { data, error } = await supabaseAdmin
    .from("user_devices")
    .upsert({
      user_id: userId,
      platform,
      fcm_token: fcmToken
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const listDeviceTokensByUserIds = async (userIds: string[]) => {
  if (userIds.length === 0) return [];
  const { data, error } = await supabaseAdmin
    .from("user_devices")
    .select("user_id, fcm_token")
    .in("user_id", userIds);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    token: row.fcm_token as string
  }));
};
