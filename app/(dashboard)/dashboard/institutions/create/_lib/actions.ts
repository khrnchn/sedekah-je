'use server';

import { db } from "@/db";
import { institutions, institutionPaymentMethods } from "@/db/schema";
import { createInstitutionSchema } from "../_lib/validations";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function createInstitution(data: z.infer<typeof createInstitutionSchema>) {
    try {
        const validated = createInstitutionSchema.parse(data);

        const newInstitution = await db.transaction(async (tx) => {
            const institution = await tx
                .insert(institutions)
                .values({
                    name: validated.name,
                    description: validated.description,
                    categoryId: validated.categoryId,

                    stateId: validated.stateId,
                    cityId: validated.cityId,

                    latitude: validated.latitude.toString(),
                    longitude: validated.longitude.toString(),
                    address: validated.address,

                    contributorId: 1, // TODO: replace with actual contributor ID
                })
                .returning();

            if (validated.paymentMethodIds.length > 0) {
                await tx.insert(institutionPaymentMethods).values(
                    validated.paymentMethodIds.map((paymentMethodId) => ({
                        institutionId: institution[0].id,
                        paymentMethodId,
                    }))
                );
            }

            return institution;
        });

        return {
            success: true,
            message: "Institution created successfully!",
            data: newInstitution,
        };
    } catch (error) {
        console.error("Failed to create institution:", error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: "Validation failed. Please check your input.",
                errors: error.errors,
            };
        }

        return {
            success: false,
            message: "Something went wrong. Please try again.",
        };
    }
}