"use server";

import { db } from "@/drizzle";
import { institutions } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";

export const getInstitutions = async (page: number = 1, pageSize: number = 10) => {
  const offset = (page - 1) * pageSize;

  const [institutionsPage, totalCount] = await Promise.all([
    db.select()
      .from(institutions)
      .limit(pageSize)
      .offset(offset)
      .orderBy(institutions.createdAt),
    db.select({ count: sql<number>`count(*)` }).from(institutions)
  ]);

  const totalPages = Math.ceil(totalCount[0].count / pageSize);

  return {
    institutions: institutionsPage,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize,
      totalCount: totalCount[0].count
    }
  };
};

export const getInstitutionById = async (id: string) => {
  return await db.select().from(institutions).where(eq(institutions.id, id));
};
