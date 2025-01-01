import { categories } from "@/db/schema";
import { db } from "..";
import { PoolClient } from "pg";

export async function seedCategories(client: PoolClient) {
  const categoryData = [
    {
      name: "mosque",
      description: "Masjid or mosque - A Muslim place of worship",
    },
    {
      name: "surau",
      description: "Surau or musolla - A smaller Muslim prayer hall",
    },
    {
      name: "welfare",
      description:
        "Badan kebajikan - Welfare organizations and charitable bodies",
    },
    {
      name: "maahad",
      description:
        "Maahad tahfiz - Islamic boarding schools or tahfiz centers",
    },
    {
      name: "others",
      description:
        "Other Islamic institutions like madrasah, tahfiz centers, or charitable organizations",
    },
    {
      name: 'placeholder',
      description: 'Placeholder category for institutions without a category'
    }
  ];

  console.log("🌱 Seeding categories...");

  try {
    await db.insert(categories).values(categoryData);
    console.log("✅ Categories seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
}
