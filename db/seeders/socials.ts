import { PoolClient } from "pg";
import { db } from "..";
import { socialPlatforms } from "../schema";

export async function seedSocials(client: PoolClient) {
  const socialData = [
    { name: 'Facebook', url: 'https://www.facebook.com' },
    { name: 'Twitter', url: 'https://www.twitter.com' },
    { name: 'Instagram', url: 'https://www.instagram.com' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com' },
    { name: 'TikTok', url: 'https://www.tiktok.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
  ];

  console.log("🌱 Seeding social platforms...");

  try {
    await db.insert(socialPlatforms).values(socialData);
    console.log("✅ Social platforms seeding completed successfully");
  } catch (error) {
    console.error("❌ Error seeding social platforms:", error);
    throw error;
  }
}