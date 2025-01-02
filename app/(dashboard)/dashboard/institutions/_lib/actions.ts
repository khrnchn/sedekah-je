"use server"

import { db } from "@/db/index"
import { Institution, institutions } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { revalidateTag, unstable_noStore } from "next/cache"

import { getErrorMessage } from "@/lib/handle-error"
import { UpdateInstitutionSchema } from "./validations"
import { takeFirstOrThrow } from "@/db/utils"

// export async function createInstitution(input: CreateInstitutionSchema) {
//   unstable_noStore()

//   try {
//     await db.transaction(async (tx) => {
//       const newInstitution = await tx
//         .insert(institutions)
//         .values({
//           orderNumber: input.orderNumber,
//           customerId: input.customerId,
//           orderStatus: input.orderStatus ?? "pending",
//           other fields here...
//         })
//         .returning({
//           id: institutions.id,
//         })
//         .then(takeFirstOrThrow)
//     })

//     revalidateTag("institutions")
//     // revalidateTag("order-status-counts")

//     return {
//       data: null,
//       error: null,
//     }
//   } catch (err) {
//     return {
//       data: null,
//       error: getErrorMessage(err),
//     }
//   }
// }

export async function updateInstitution(input: UpdateInstitutionSchema & { id: number }) {
  unstable_noStore()

  try {
    const data = await db
      .update(institutions)
      .set({
        name: input.name,
        categoryId: input.categoryId ? Number(input.categoryId) : undefined,
        stateId: input.stateId ? Number(input.stateId) : undefined,
        cityId: input.cityId ? Number(input.cityId) : undefined,
      })
      .where(eq(institutions.id, input.id))
      .returning({
        categoryId: institutions.categoryId,
        stateId: institutions.stateId,
        cityId: institutions.cityId,
      })
      .then(takeFirstOrThrow)

    revalidateTag("institutions")
    
    if (data.categoryId === Number(input.categoryId)) {
      revalidateTag("category-counts")
    }

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function updateInstitutions(input: {
  ids: number[]
  // eg: note?: Institution["note"]
  // eg: deliveryStatus?: Institution["deliveryStatus"]
}) {
  unstable_noStore()

  try {
    const data = await db
      .update(institutions)
      .set({
        // eg: note: input.note,
        // eg: deliveryStatus: input.deliveryStatus,
      })
      .where(inArray(institutions.id, input.ids))
      .returning({
        // eg: deliveryStatus: institutions.deliveryStatus,
      })
      .then(takeFirstOrThrow)

    revalidateTag("institutions")
    // if (data.deliveryStatus === input.deliveryStatus) {
    //   revalidateTag("order-status-counts")
    // }

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function deleteInstitution(input: { id: number }) {
  unstable_noStore()
  try {
    await db.transaction(async (tx) => {
      await tx.delete(institutions).where(eq(institutions.id, input.id))
    })

    revalidateTag("institutions")
    revalidateTag("category-counts")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function deleteInstitutions(input: { ids: number[] }) {
  unstable_noStore()
  try {
    await db.transaction(async (tx) => {
      await tx.delete(institutions).where(inArray(institutions.id, input.ids))
    })

    revalidateTag("institutions")
    revalidateTag("category-counts")

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}
