import { supabaseAdmin } from "../lib/supabase.js";

export type AuditLogInput = {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  ip?: string | null;
  userAgent?: string | string[] | null;
  payload?: Record<string, unknown>;
};

export const insertAuditLog = async (input: AuditLogInput): Promise<void> => {
  const userAgent = Array.isArray(input.userAgent) ? input.userAgent.join(",") : input.userAgent;
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    ip: input.ip ?? null,
    user_agent: userAgent ?? null,
    payload: input.payload ?? {}
  });
  if (error) throw error;
};
