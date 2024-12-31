import { seedCategories } from "./categories";
import { seedStates } from "./states";
import { seedCities } from "./cities";
import { seedBanks } from "./banks";
import { seedUsers } from "./users";
import { seedSocials } from "./socials";

async function main() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Run seeders in order of dependencies
    await seedCategories();
    await seedStates();
    await seedCities();
    await seedBanks();
    await seedUsers();
    await seedSocials();
    
    console.log("✅ Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  }
}

main();
