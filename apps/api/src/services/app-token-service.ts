import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AuthUser } from "../types/auth.js";

type AppTokenPayload = {
  sub: string;
  role: AuthUser["role"];
  phone?: string | null;
  email?: string | null;
  src: "helparo_app";
};

export const signAppToken = (user: AuthUser): string => {
  const payload: AppTokenPayload = {
    sub: user.id,
    role: user.role,
    phone: user.phone ?? null,
    email: user.email ?? null,
    src: "helparo_app"
  };
  return jwt.sign(payload, env.APP_JWT_SECRET, {
    algorithm: "HS256",
    issuer: "helparo-api",
    audience: "helparo-mobile",
    expiresIn: "7d"
  });
};

export const verifyAppToken = (token: string): AppTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, env.APP_JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "helparo-api",
      audience: "helparo-mobile"
    }) as AppTokenPayload;
    return decoded.src === "helparo_app" ? decoded : null;
  } catch {
    return null;
  }
};
