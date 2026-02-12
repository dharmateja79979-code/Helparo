export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type AdminUser = {
  id: string;
  role: "customer" | "helper" | "admin";
  email?: string | null;
  phone?: string | null;
};
