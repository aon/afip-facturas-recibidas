import { env } from "./env.js"
import logger from "pino"

export const defaultLogger = logger({ level: env.LOG_LEVEL ?? "info" })
