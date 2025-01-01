import { paymentMethods } from "@/db/schema";
import { db } from "..";
import { PoolClient } from "pg";

export async function seedPaymentMethods(client: PoolClient) {
  const data = [
    {
      name: "duitnow",
      description: "DuitNow - A Malaysian instant fund transfer service",
    },
    {
      name: "tng",
      description: "Touch 'n Go eWallet - A Malaysian e-wallet service",
    },
    {
        name: "boost",
        description: "Boost eWallet - A Malaysian e-wallet service",
    },
  ];

  console.log("🌱 Seeding payment methods...");

  try {
    await db.insert(paymentMethods).values(data);
    console.log("✅ Payment methods seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding payment methods:", error);
    throw error;
  }
}
