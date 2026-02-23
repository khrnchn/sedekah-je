import { NextResponse } from "next/server";

type Params = {
	params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
	const { id } = await params;

	return NextResponse.json({
		confirmation_code: id,
		status: "completed",
	});
}
