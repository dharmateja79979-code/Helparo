import type { FastifyPluginAsync } from "fastify";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { verifyAppToken } from "../services/app-token-service.js";
import type { AuthUser } from "../types/auth.js";

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (request: import("fastify").FastifyRequest) => Promise<void>;
    requireRole: (
      request: import("fastify").FastifyRequest,
      roles: Array<AuthUser["role"]>
    ) => Promise<void>;
  }
}

export const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorate("requireAuth", async (request) => {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError();
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const appToken = verifyAppToken(token);
    if (appToken) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("id, role, phone, email")
        .eq("id", appToken.sub)
        .single();

      if (profileError || !profile) {
        throw new UnauthorizedError("User not provisioned");
      }
      request.authUser = {
        id: profile.id,
        role: profile.role,
        phone: profile.phone,
        email: profile.email
      };
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedError("Invalid token");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, role, phone, email")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      throw new UnauthorizedError("User not provisioned");
    }

    request.authUser = {
      id: profile.id,
      role: profile.role,
      phone: profile.phone,
      email: profile.email
    };
  });

  app.decorate("requireRole", async (request, roles) => {
    await app.requireAuth(request);
    if (!request.authUser || !roles.includes(request.authUser.role)) {
      throw new ForbiddenError();
    }
  });
};
