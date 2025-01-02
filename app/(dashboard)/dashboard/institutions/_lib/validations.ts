import { type Institution } from "@/db/schema";
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import * as z from "zod";

import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

export const searchParamsCache = createSearchParamsCache({
  flags: parseAsArrayOf(z.enum(["advancedTable", "floatingBar"])).withDefault(
    []
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Institution>().withDefault([
    { id: "createdAt", desc: true },
  ]),

  name: parseAsString.withDefault(""),

  categoryId: parseAsInteger,
  stateId: parseAsInteger,
  cityId: parseAsInteger,

  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),

  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export const createInstitutionSchema = z.object({
  name: z.string().min(3, "Institution name must be at least 3 characters long")
    .max(100, "Institution name cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters long")
    .max(500, "Description cannot exceed 500 characters"),
  categoryId: z.coerce.number({
    required_error: "Please select a category",
    invalid_type_error: "Category selection is required"
  }),
  stateId: z.coerce.number({
    required_error: "Please select a state",
    invalid_type_error: "State selection is required"
  }),
  cityId: z.coerce.number({
    required_error: "Please select a city",
    invalid_type_error: "City selection is required"
  }),
  latitude: z.coerce.number({
    required_error: "Latitude is required",
    invalid_type_error: "Invalid latitude value"
  }).min(-90, "Invalid latitude value").max(90, "Invalid latitude value"),
  longitude: z.coerce.number({
    required_error: "Longitude is required",
    invalid_type_error: "Invalid longitude value"
  }).min(-180, "Invalid longitude value").max(180, "Invalid longitude value"),
  socialLinks: z.array(
    z.object({
      platformId: z.number({
        required_error: "Social platform is required",
        invalid_type_error: "Invalid social platform"
      }),
      url: z.string({
        required_error: "URL is required"
      }).url("Please enter a valid URL")
    })
  ).optional(),
  paymentMethodIds: z.array(
    z.number({
      required_error: "Payment method is required",
      invalid_type_error: "Invalid payment method"
    })
  ).optional()
})

export const updateInstitutionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),

  categoryId: z.number().optional(),
  stateId: z.number().optional(),
  cityId: z.number().optional(),

  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // social links
  socialLinks: z
    .array(
      z.object({
        platformId: z.number().positive(),
        url: z.string().url(),
      })
    )
    .optional(),
});

export type GetInstitutionsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateInstitutionSchema = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionSchema = z.infer<typeof updateInstitutionSchema>;
