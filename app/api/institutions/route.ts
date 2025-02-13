import { getCategories, getCities, getStates } from "@/app/(dashboard)/dashboard/institutions/_lib/queries";
import { NextResponse } from "next/server";
import { institutions } from "@/app/data/institutions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateId = searchParams.get("stateId");

  try {
    const result = await Promise.all([
      getCategories(),
      getStates(),
      stateId ? getCities(Number(stateId)) : Promise.resolve([]),
    ]);

    const [categories, states, cities] = result;

    if (result.every((data) => data.length === 0)) {
      return NextResponse.json(institutions, {
        status: 200,
      });
    }

    return NextResponse.json({ categories, states, cities }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
