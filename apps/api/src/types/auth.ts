import "fastify";

export type AuthUser = {
  id: string;
  role: "customer" | "helper" | "admin";
  phone?: string | null;
  email?: string | null;
};

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
    requestId: string;
  }
}
