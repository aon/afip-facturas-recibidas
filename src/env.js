import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    AFIP_USERNAME: z.string().min(1),
    AFIP_PASSWORD: z.string().min(1),
    EMAIL_HOST: z.string().min(1),
    EMAIL_PORT: z.coerce.number(),
    EMAIL_HOST_USER: z.string().min(1),
    EMAIL_HOST_PASSWORD: z.string().min(1),
    EMAIL_USE_TLS: z.preprocess((str) => str === "true", z.boolean()),
    NOTIFICATION_TO_EMAIL: z.string().email(),
    NOTIFICATION_FROM_EMAIL: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
