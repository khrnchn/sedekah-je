import { getCategories, getCities, getStates } from "@/app/(dashboard)/dashboard/institutions/_lib/queries";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateId = searchParams.get("stateId");

  try {
    const [categories, states, cities] = await Promise.all([
      getCategories(),
      getStates(),
      stateId ? getCities(Number(stateId)) : Promise.resolve([]),
    ]);

    return NextResponse.json({ categories, states, cities });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}