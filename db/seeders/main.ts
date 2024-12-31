import { seedCategories } from "./categories";

async function main() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Run seeders in order of dependencies
    await seedCategories();
    
    console.log("✅ Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  }
}

main();
