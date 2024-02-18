import { env } from "./env.js"
import { defaultLogger } from "./log.js"
import nodemailer from "nodemailer"
import { v4 as uuidv4 } from "uuid"

const log = defaultLogger.child({ target: "email" })

const emailClient = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_USE_TLS,
  auth: {
    user: env.EMAIL_HOST_USER,
    pass: env.EMAIL_HOST_PASSWORD,
  },
})

/**
 * @typedef {Object} Email
 * @property {string} to
 * @property {string} subject
 * @property {string} [text]
 * @property {string} [html]
 */

/**
 * @param {Email} email
 */
export async function sendEmail({ to, subject, text, html }) {
  log.info({ to, subject }, "Sending email")
  log.debug({ text, html }, "Email content")
  await emailClient.sendMail({
    from: env.NOTIFICATION_FROM_EMAIL,
    to,
    subject,
    text,
    html,
    headers: {
      "X-Entity-Ref-ID": uuidv4(),
    },
  })
}
