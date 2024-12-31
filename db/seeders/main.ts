import { seedCategories } from "./categories";
import { seedStates } from "./states";
import { seedCities } from "./cities";

async function main() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Run seeders in order of dependencies
    await seedCategories();
    await seedStates();
    await seedCities();
    
    console.log("✅ Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  }
}

main();
