import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";

type ExportInstitution = {
	slug: string;
	name: string;
	description: string | null;
	category: string;
	state: string;
	city: string;
	address: string | null;
	coords: [number, number] | null;
	supportedPayment: string[] | null;
	qrContent: string | null;
	institutionUrl: string;
	embedUrl: string;
};

function getBaseUrl(request: NextRequest) {
	return (
		process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
		request.nextUrl.origin.replace(/\/$/, "")
	);
}

function csvEscape(value: unknown) {
	if (value === null || value === undefined) return "";
	const text = Array.isArray(value) ? JSON.stringify(value) : String(value);
	return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: ExportInstitution[]) {
	const columns = [
		"slug",
		"name",
		"description",
		"category",
		"state",
		"city",
		"address",
		"coords",
		"supportedPayment",
		"qrContent",
		"institutionUrl",
		"embedUrl",
	] satisfies (keyof ExportInstitution)[];

	return [
		columns.join(","),
		...rows.map((row) =>
			columns.map((column) => csvEscape(row[column])).join(","),
		),
	].join("\n");
}

export async function GET(request: NextRequest) {
	await requireAdminSession();

	const format = request.nextUrl.searchParams.get("format") ?? "json";
	const baseUrl = getBaseUrl(request);

	const approvedInstitutions = await db
		.select({
			slug: institutions.slug,
			name: institutions.name,
			description: institutions.description,
			category: institutions.category,
			state: institutions.state,
			city: institutions.city,
			address: institutions.address,
			coords: institutions.coords,
			supportedPayment: institutions.supportedPayment,
			qrContent: institutions.qrContent,
		})
		.from(institutions)
		.where(eq(institutions.status, "approved"))
		.orderBy(asc(institutions.name), asc(institutions.id));

	const exportedAt = new Date().toISOString();
	const data: ExportInstitution[] = approvedInstitutions.map((institution) => ({
		...institution,
		institutionUrl: `${baseUrl}/${institution.category}/${institution.slug}`,
		embedUrl: `${baseUrl}/embed/${institution.slug}`,
	}));

	if (format === "csv") {
		return new NextResponse(toCsv(data), {
			headers: {
				"Content-Disposition": `attachment; filename="sedekah-je-approved-institutions-${exportedAt.slice(0, 10)}.csv"`,
				"Content-Type": "text/csv; charset=utf-8",
			},
		});
	}

	return NextResponse.json(
		{
			exportedAt,
			count: data.length,
			data,
		},
		{
			headers: {
				"Content-Disposition": `attachment; filename="sedekah-je-approved-institutions-${exportedAt.slice(0, 10)}.json"`,
			},
		},
	);
}
