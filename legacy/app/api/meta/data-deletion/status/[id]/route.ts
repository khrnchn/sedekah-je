import { NextResponse } from "next/server";
import { getMetaDeletionJobStatus } from "@/app/api/meta/_lib/meta-data-deletion-jobs";

type Params = {
	params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
	const { id } = await params;
	const job = await getMetaDeletionJobStatus(id);

	if (!job) {
		return NextResponse.json(
			{
				ok: false,
				confirmation_code: id,
				status: "error",
				message: "Deletion job not found.",
			},
			{ status: 404 },
		);
	}

	return NextResponse.json({
		confirmation_code: job.confirmationCode,
		status: job.status,
	});
}
