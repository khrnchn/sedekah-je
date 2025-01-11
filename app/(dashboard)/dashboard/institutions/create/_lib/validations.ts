import * as z from "zod";

export type CreateInstitutionSchema = z.infer<typeof createInstitutionSchema>;

export const socialLinkSchema = z.object({
    platformId: z.number({
        required_error: "Please select a social platform",
    }),
    username: z.string().min(1, "Username is required"),
    url: z.string().url("Please enter a valid URL")
});

export const createInstitutionSchema = z.object({
    name: z.string().min(2, "Institution name must be at least 2 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),

    // optional contact info
    // phone: z.string()
    //     .regex(/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/)
    //     .optional(),
    // email: z.string().email().optional(),

    // references
    categoryId: z.number({
        required_error: "Please select a category.",
    }),
    stateId: z.number({
        required_error: "Please select a state.",
    }),
    cityId: z.number({
        required_error: "Please select a city.",
    }),

    // location (should be retrieved and populated by google maps api)
    address: z.string().min(2, "Address is required."),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),

    socialLinks: z.array(socialLinkSchema).optional(),

    // others
    paymentMethodIds: z.array(z.number())
        .min(1, "Select at least one payment method"),
});