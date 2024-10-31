  import { defineConfig } from "drizzle-kit";
  import * as dotenv from "dotenv";
  dotenv.config();

  export default defineConfig({
    out: "./drizzle",
    dialect: "postgresql",
    schema: "./drizzle/schema.ts",
    dbCredentials: {
      host: process.env.POSTGRES_HOST!,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE!,
      ssl: true,
    },
    schemaFilter: "public",
    tablesFilter: "*",
    introspect: {
      casing: "camel",
    },
    migrations: {
      prefix: "timestamp",
      table: "__drizzle_migrations__",
      schema: "public",
    },
    breakpoints: true,
    strict: true,
    verbose: true,
  });