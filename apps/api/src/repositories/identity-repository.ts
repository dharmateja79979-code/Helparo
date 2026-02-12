import { supabaseAdmin } from "../lib/supabase.js";

export const findUserIdByFirebaseUid = async (firebaseUid: string) => {
  const { data, error } = await supabaseAdmin
    .from("auth_identities")
    .select("user_id")
    .eq("provider", "firebase")
    .eq("external_uid", firebaseUid)
    .maybeSingle();
  if (error) throw error;
  return (data?.user_id as string | undefined) ?? null;
};

export const upsertFirebaseIdentity = async (userId: string, firebaseUid: string) => {
  const { error } = await supabaseAdmin.from("auth_identities").upsert(
    {
      user_id: userId,
      provider: "firebase",
      external_uid: firebaseUid
    },
    { onConflict: "provider,external_uid" }
  );
  if (error) throw error;
};
