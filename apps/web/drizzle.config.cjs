// drizzle.config.cjs
const path = require("path");
const dotenv = require("dotenv");

/** Load env from monorepo root */
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

module.exports = {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
