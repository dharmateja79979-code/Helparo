import { z } from "zod";

export const registerDeviceSchema = z.object({
  platform: z.enum(["android", "ios", "web"]),
  fcmToken: z.string().min(20).max(500)
});
