import type { FastifyPluginAsync } from "fastify";
import { ok } from "../lib/api-response.js";
import { AppError } from "../lib/errors.js";
import { firebaseAuthOrNull } from "../lib/firebase-admin.js";
import { insertAuditLog } from "../repositories/audit-repository.js";
import { findUserIdByFirebaseUid, upsertFirebaseIdentity } from "../repositories/identity-repository.js";
import { getUserProfile, updateUserRoleAndProfile } from "../repositories/user-repository.js";
import { firebaseExchangeSchema } from "../schemas/firebase-schemas.js";
import { signAppToken } from "../services/app-token-service.js";
import { supabaseAdmin } from "../lib/supabase.js";

export const firebaseAuthRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/firebase/exchange", async (request, reply) => {
    const body = firebaseExchangeSchema.parse(request.body);
    if (!firebaseAuthOrNull) {
      throw new AppError("FIREBASE_NOT_CONFIGURED", "Firebase admin is not configured", 400);
    }

    const decoded = await firebaseAuthOrNull.verifyIdToken(body.firebaseIdToken, true);
    const firebaseUid = decoded.uid;
    const phone = decoded.phone_number ?? null;
    const email = decoded.email ?? null;

    let userId = await findUserIdByFirebaseUid(firebaseUid);

    if (!userId) {
      const userCreate = await supabaseAdmin.auth.admin.createUser({
        phone: phone ?? undefined,
        email: email ?? undefined,
        phone_confirm: Boolean(phone),
        email_confirm: Boolean(email),
        user_metadata: {
          name: body.name ?? "",
          role: body.role
        }
      });
      if (userCreate.error || !userCreate.data.user) {
        throw new AppError("SUPABASE_USER_CREATE_FAILED", "Could not create user", 500, userCreate.error);
      }
      userId = userCreate.data.user.id;
      await upsertFirebaseIdentity(userId, firebaseUid);
    }

    await updateUserRoleAndProfile({
      userId,
      role: body.role,
      name: body.name
    });

    const profile = await getUserProfile(userId);
    if (!profile) throw new AppError("USER_PROFILE_MISSING", "User profile missing", 500);

    const appToken = signAppToken({
      id: profile.id,
      role: profile.role,
      phone: profile.phone,
      email: profile.email
    });

    await insertAuditLog({
      actorId: profile.id,
      action: "auth.firebase.exchange",
      entityType: "user",
      entityId: profile.id,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      payload: { firebaseUid }
    });

    reply.send(ok({ accessToken: appToken, user: profile }));
  });
};
