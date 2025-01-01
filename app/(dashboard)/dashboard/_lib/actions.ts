"use server";

import { db } from "@/db";
import { categories, institutions } from "@/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";

export async function getInstitutionsCount(): Promise<number> {
  const result = await db.select({ count: sql`count(*)` }).from(institutions);
  return Number(result[0].count);
}

export async function getMosqueCount(): Promise<number> {
  const category = await db.query.categories.findFirst({
    where: eq(categories.name, "mosque"),
  });

  if (!category) return 0;

  const count = await db
    .$count(institutions, eq(institutions.categoryId, category!.id))

  return count;
}

export async function getSurauCount(): Promise<number> {
  const category = await db.query.categories.findFirst({
    where: eq(categories.name, "surau"),
  });

  if (!category) return 0;

  const count = await db
  .$count(institutions, eq(institutions.categoryId, category!.id))

  return count;
}

export async function getOthersCount(): Promise<number> {
  const categoryIds = await db.select({
    id: categories.id,
  }).from(categories).where(
    or(
      eq(categories.name, "others"),
      eq(categories.name, "welfare"),
      eq(categories.name, "maahad"),
    )
  );

  if (categoryIds.length === 0) return 0;

  const count = await db
    .$count(institutions, inArray(institutions.categoryId, categoryIds.map((c) => c.id)));

  return count;
}
