import { Pool } from "pg";

async function truncateAll() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log("🧹 Starting database cleanup...");

    // Truncate all tables in reverse order of dependencies
    await client.query(`
      TRUNCATE TABLE 
        institution_payment_methods,
        institution_bank_accounts,
        institution_social_links,
        institutions,
        payment_methods,
        banks,
        social_platforms,
        malaysian_cities,
        malaysian_states,
        categories,
        users
      RESTART IDENTITY
      CASCADE;
    `);

    await client.query('COMMIT');
    console.log("✅ Database cleanup completed successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Database cleanup failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

truncateAll().catch((error) => {
  console.error(error);
  process.exit(1);
});
