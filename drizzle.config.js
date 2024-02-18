import "dotenv/config"

/** @type {import("drizzle-kit").Config} */
const config = {
  schema: "./src/db/schema.js",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: "sqlite.db",
  },
}

export default config
