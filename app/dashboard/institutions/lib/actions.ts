"use server";

import { db } from "@/drizzle";
import { institutions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const getInstitutions = async () => {
  return await db.select().from(institutions);
};

export const getInstitutionById = async (id: string) => {
  return await db.select().from(institutions).where(eq(institutions.id, id));
};
