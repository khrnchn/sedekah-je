import { institutions, type Institution } from "@/db/schema"
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"
import * as z from "zod"

import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers"

export const searchParamsCache = createSearchParamsCache({
  flags: parseAsArrayOf(z.enum(["advancedTable", "floatingBar"])).withDefault(
    []
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Institution>().withDefault([
    { id: "createdAt", desc: true },
  ]),

  institutionNumber: parseAsString.withDefault(""),
  deliveryStatus: parseAsArrayOf(z.enum(institutions.deliveryStatus.enumValues)).withDefault([]),

  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),

  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export const createInstitutionSchema = z.object({
  // eg: institutionNumber: z.number().int().positive(),

  // eg: customerId: z.bigint().optional(),

  // eg: institutionStatus: z.string().optional().default("pending"),

  // and other fields here...
});

export const updateInstitutionSchema = z.object({
  // eg: note: z.string().optional(),
  // eg: deliveryStatus: z.enum(institutions.deliveryStatus.enumValues).default("PENDING"),
})

export type GetInstitutionsSchema = Awaited<ReturnType<typeof searchParamsCache.parse>>
export type CreateInstitutionSchema = z.infer<typeof createInstitutionSchema>
export type UpdateInstitutionSchema = z.infer<typeof updateInstitutionSchema>
