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
export type UpdateInstitutionSchema = z.infer<typeof updateInstitutionSchema>;
