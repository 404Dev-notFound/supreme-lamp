const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();
const { defineConfig } = require("prisma/config");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword9555@localhost:5432/flowCTRL";

module.exports = defineConfig({
  schema: "../../flowCTRL data files/prisma/schema.prisma",
  migrations: {
    path: "../../flowCTRL data files/prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
