import "server-only";

import { db } from "@/db";
import {
  categories,
  institutions,
  InstitutionWithRelations,
  malaysianCities,
  malaysianStates,
  type Institution,
} from "@/db/schema";
import { and, asc, count, desc, eq, gt, gte, ilike, lte } from "drizzle-orm";

import { filterColumns } from "@/lib/filter-columns";
import { unstable_cache } from "@/lib/unstable-cache";

import { type GetInstitutionsSchema } from "./validations";

export async function getInstitutions(input: GetInstitutionsSchema) {
  return await unstable_cache(
    async () => {
      try {
        const offset = (input.page - 1) * input.perPage;
        const fromDate = input.from ? new Date(input.from) : undefined;
        const toDate = input.to ? new Date(input.to) : undefined;
        const advancedTable = input.flags.includes("advancedTable");

        const advancedWhere = filterColumns({
          table: institutions,
          filters: input.filters,
          joinOperator: input.joinOperator,
        });

        const where = advancedTable
          ? advancedWhere
          : and(
              input.name
                ? ilike(institutions.name, `%${input.name}%`)
                : undefined,

              input.categoryId
                ? eq(institutions.categoryId, input.categoryId)
                : undefined,
              input.stateId
                ? eq(institutions.stateId, input.stateId)
                : undefined,
              input.cityId ? eq(institutions.cityId, input.cityId) : undefined,

              fromDate ? gte(institutions.createdAt, fromDate) : undefined,
              toDate ? lte(institutions.createdAt, toDate) : undefined
            );

        const orderBy =
          input.sort.length > 0
            ? input.sort.map((item) =>
                item.desc
                  ? desc(institutions[item.id])
                  : asc(institutions[item.id])
              )
            : [asc(institutions.createdAt)];

        const { data, total } = await db.transaction(async (tx) => {
          const data = await tx.query.institutions.findMany({
            limit: input.perPage,
            offset,
            where,
            orderBy,
            with: {
              category: true,
              state: true,
              city: true,
            },
          });

          const total = await tx
            .select({
              count: count(),
            })
            .from(institutions)
            .where(where)
            .execute()
            .then((res) => res[0]?.count ?? 0);

          return {
            data,
            total,
          };
        });

        const pageCount = Math.ceil(total / input.perPage);
        return { data, pageCount };
      } catch (err) {
        return { data: [], pageCount: 0 };
      }
    },
    [JSON.stringify(input)],
    {
      revalidate: 3600,
      tags: ["institutions"],
    }
  )();
}

export async function getCategoryCounts() {
  return unstable_cache(
    async () => {
      try {
        return await db
          .select({
            categoryId: institutions.categoryId,
            count: count(),
          })
          .from(institutions)
          .groupBy(institutions.categoryId)
          .having(gt(count(), 0))
          .then((res) =>
            res.reduce((acc, { categoryId, count }) => {
              acc[categoryId] = count;
              return acc;
            }, {} as Record<Institution["categoryId"], number>)
          );
      } catch (err) {
        return {} as Record<Institution["categoryId"], number>;
      }
    },
    ["category-counts"],
    {
      revalidate: 3600,
    }
  )();
}

export async function getCategories() {
  return await unstable_cache(
    async () => {
      try {
        return await db
          .select({
            id: categories.id,
            name: categories.name,
          })
          .from(categories)
          .orderBy(asc(categories.name));
      } catch (err) {
        return [];
      }
    },
    ["categories"],
    {
      revalidate: 3600,
      tags: ["categories"],
    }
  )();
}

export async function getStates() {
  return await unstable_cache(
    async () => {
      try {
        return await db
          .select({
            id: malaysianStates.id,
            name: malaysianStates.name,
          })
          .from(malaysianStates)
          .orderBy(asc(malaysianStates.name));
      } catch (err) {
        return [];
      }
    },
    ["states"],
    {
      revalidate: 3600,
      tags: ["states"],
    }
  )();
}

export async function getCities(stateId?: number) {
  return await unstable_cache(
    async () => {
      try {
        return await db
          .select({
            id: malaysianCities.id,
            name: malaysianCities.name,
            stateId: malaysianCities.stateId,
          })
          .from(malaysianCities)
          .where(stateId ? eq(malaysianCities.stateId, stateId) : undefined)
          .orderBy(asc(malaysianCities.name));
      } catch (err) {
        return [];
      }
    },
    [`cities-${stateId ?? "all"}`],
    {
      revalidate: 3600,
      tags: ["cities"],
    }
  )();
}
