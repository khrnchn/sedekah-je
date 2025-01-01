import "server-only"

import { db } from "@/db"
import { institutions, type Institution } from "@/db/schema"
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lte,
} from "drizzle-orm"

import { filterColumns } from "@/lib/filter-columns"
import { unstable_cache } from "@/lib/unstable-cache"

import { type GetInstitutionsSchema } from "./validations"

export async function getInstitutions(input: GetInstitutionsSchema) {
  return await unstable_cache(
    async () => {
      try {
        const offset = (input.page - 1) * input.perPage
        const fromDate = input.from ? new Date(input.from) : undefined
        const toDate = input.to ? new Date(input.to) : undefined
        const advancedTable = input.flags.includes("advancedTable")

        const advancedWhere = filterColumns({
          table: institutions,
          filters: input.filters,
          joinOperator: input.joinOperator,
        })

        const where = advancedTable
          ? advancedWhere
          : and(
            input.institutionNumber ? eq(institutions.institutionNumber, Number(input.institutionNumber)) : undefined,
            input.deliveryStatus.length > 0
              ? inArray(institutions.deliveryStatus, input.deliveryStatus)
              : undefined,
            fromDate ? gte(institutions.createdAt, fromDate) : undefined,
            toDate ? lte(institutions.createdAt, toDate) : undefined
          )

        const orderBy =
          input.sort.length > 0
            ? input.sort.map((item) =>
              item.desc ? desc(institutions[item.id]) : asc(institutions[item.id])
            )
            : [asc(institutions.createdAt)]

        const { data, total } = await db.transaction(async (tx) => {
          const data = await tx
            .select()
            .from(institutions)
            .limit(input.perPage)
            .offset(offset)
            .where(where)
            .orderBy(...orderBy)

          const total = await tx
            .select({
              count: count(),
            })
            .from(institutions)
            .where(where)
            .execute()
            .then((res) => res[0]?.count ?? 0)

          return {
            data,
            total,
          }
        })

        const pageCount = Math.ceil(total / input.perPage)
        return { data, pageCount }
      } catch (err) {
        return { data: [], pageCount: 0 }
      }
    },
    [JSON.stringify(input)],
    {
      revalidate: 3600,
      tags: ["institutions"],
    }
  )()
}

export async function getInstitutionStatusCounts() {
  return unstable_cache(
    async () => {
      try {
        return await db
          .select({
            deliveryStatus: institutions.deliveryStatus,
            count: count(),
          })
          .from(institutions)
          .groupBy(institutions.deliveryStatus)
          .having(gt(count(), 0))
          .then((res) =>
            res.reduce(
              (acc, { deliveryStatus, count }) => {
                acc[deliveryStatus] = count
                return acc
              },
              {} as Record<Institution["deliveryStatus"], number>
            )
          )
      } catch (err) {
        return {} as Record<Institution["deliveryStatus"], number>
      }
    },
    ["institution-status-counts"],
    {
      revalidate: 3600,
    }
  )()
}
