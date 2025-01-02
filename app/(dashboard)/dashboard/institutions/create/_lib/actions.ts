'use server';

import { createInstitutionSchema } from "../../_lib/validations";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { institutionSocialLinks, institutions, institutionPaymentMethods } from "@/db/schema";

export async function createInstitution(formData: FormData) {
  try {
    console.log("Received FormData:", Array.from(formData.entries())); // Log FormData
    // Parse form data into a plain object
    const rawData = Object.fromEntries(formData);
    console.log("Parsed rawData:", rawData); // Log parsed data

    // Parse social links from formData
    const socialLinks = [];
    let i = 0;
    while (rawData[`socialLinks.${i}.platformId`]) {
      socialLinks.push({
        platformId: Number(rawData[`socialLinks.${i}.platformId`]),
        url: rawData[`socialLinks.${i}.url`] as string,
      });
      i++;
    }

    // Parse payment method IDs from formData
    const paymentMethodIds = [];
    let j = 0;
    while (rawData[`paymentMethodIds.${j}`]) {
      paymentMethodIds.push(Number(rawData[`paymentMethodIds.${j}`]));
      j++;
    }

    // Prepare data for validation
    const data = {
      ...rawData,
      latitude: Number(rawData.latitude),
      longitude: Number(rawData.longitude),
      categoryId: Number(rawData.categoryId),
      stateId: Number(rawData.stateId),
      cityId: Number(rawData.cityId),
      socialLinks,
      paymentMethodIds,
    };

    // Validate the data using Zod schema
    const parsed = createInstitutionSchema.parse(data);

    // Perform database operations in a transaction
    return await db.transaction(async (tx) => {
      // Create the institution
        const [institution] = await tx
          .insert(institutions)
          .values({
            name: parsed.name,
            description: parsed.description,
            categoryId: parsed.categoryId,
            stateId: parsed.stateId,
            cityId: parsed.cityId,
            latitude: parsed.latitude.toString(),
            longitude: parsed.longitude.toString(),
            contributorId: 1, 
            status: "pending",
          })
          .returning();

      // Create social links if any
      if (parsed.socialLinks?.length) {
        await tx.insert(institutionSocialLinks).values(
          parsed.socialLinks.map((link) => ({
            institutionId: institution.id,
            platformId: link.platformId,
            url: link.url,
            username: link.url.split("/").pop() || "", // Extract username from URL
          }))
        );
      }

      // Create payment method links if any
      if (parsed.paymentMethodIds?.length) {
        await tx.insert(institutionPaymentMethods).values(
          parsed.paymentMethodIds.map((paymentMethodId) => ({
            institutionId: institution.id,
            paymentMethodId,
          }))
        );
      }

      // Revalidate the institutions page to reflect changes
      revalidatePath("/dashboard/institutions");

      return { success: true, institutionId: institution.id };
    });
  } catch (error) {
    console.error("Failed to create institution:", error);

    // Return a user-friendly error message
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}