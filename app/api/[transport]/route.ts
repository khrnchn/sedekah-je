import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import {
	categories,
	states,
	supportedPayments,
} from "@/lib/institution-constants";

function createServer() {
	const server = new McpServer({
		name: "sedekah-je",
		version: "1.0.0",
	});

	// Tool 1: List available filter options
	server.tool(
		"list_filter_options",
		"Returns all available filter values for querying institutions: categories (masjid, surau, tahfiz, kebajikan, lain-lain), Malaysian states (16 states), and supported payment methods (duitnow, tng, boost).",
		async () => ({
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(
						{
							categories: [...categories],
							states: [...states],
							payment_methods: [...supportedPayments],
						},
						null,
						2,
					),
				},
			],
		}),
	);

	// Tool 2: Search and filter institutions
	// @ts-expect-error - MCP SDK generic recursion limit with 6 optional params
	server.tool(
		"search_institutions",
		"Search and filter approved Malaysian religious institutions (mosques, suraus, etc.) with pagination. Returns institution name, category, state, city, QR payment info, and coordinates.",
		{
			search: z
				.string()
				.optional()
				.describe("Text search across institution name, description, and city"),
			category: z
				.string()
				.optional()
				.describe(
					"Filter by category: masjid, surau, tahfiz, kebajikan, or lain-lain",
				),
			state: z
				.string()
				.optional()
				.describe(
					"Filter by Malaysian state: Johor, Kedah, Kelantan, Melaka, Negeri Sembilan, Pahang, Perak, Perlis, Pulau Pinang, Sabah, Sarawak, Selangor, Terengganu, W.P. Kuala Lumpur, W.P. Labuan, W.P. Putrajaya",
				),
			payment_method: z
				.string()
				.optional()
				.describe("Filter by supported payment method: duitnow, tng, or boost"),
			page: z
				.number()
				.int()
				.min(1)
				.max(1000)
				.optional()
				.describe("Page number (default: 1, max: 1000)"),
			limit: z
				.number()
				.int()
				.min(1)
				.max(100)
				.optional()
				.describe("Results per page (default: 20, max: 100)"),
		},
		async ({ search, category, state, payment_method, page, limit }) => {
			const MAX_PAGE = 1000;
			const pageNum = Math.min(page ?? 1, MAX_PAGE);
			const limitNum = limit ?? 20;
			const offset = (pageNum - 1) * limitNum;

			const conditions = [eq(institutions.status, "approved")];

			if (search?.trim()) {
				const searchCondition = or(
					ilike(institutions.name, `%${search}%`),
					ilike(institutions.description, `%${search}%`),
					ilike(institutions.city, `%${search}%`),
				);
				if (searchCondition) {
					conditions.push(searchCondition);
				}
			}

			if (category) {
				conditions.push(
					eq(institutions.category, category as (typeof categories)[number]),
				);
			}

			if (state) {
				conditions.push(
					eq(institutions.state, state as (typeof states)[number]),
				);
			}

			if (payment_method) {
				conditions.push(
					sql`${institutions.supportedPayment} @> ${JSON.stringify([payment_method])}::jsonb`,
				);
			}

			const [results, totalResult] = await Promise.all([
				db
					.select({
						id: institutions.id,
						name: institutions.name,
						slug: institutions.slug,
						category: institutions.category,
						state: institutions.state,
						city: institutions.city,
						qrImage: institutions.qrImage,
						supportedPayment: institutions.supportedPayment,
						coords: institutions.coords,
					})
					.from(institutions)
					.where(and(...conditions))
					.orderBy(institutions.name)
					.limit(limitNum)
					.offset(offset),
				db
					.select({ count: count() })
					.from(institutions)
					.where(and(...conditions)),
			]);

			const total = totalResult[0]?.count ?? 0;

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(
							{
								institutions: results,
								pagination: {
									page: pageNum,
									limit: limitNum,
									total,
									totalPages: Math.ceil(total / limitNum),
									hasMore: offset + limitNum < total,
								},
							},
							null,
							2,
						),
					},
				],
			};
		},
	);

	// Tool 3: Get institution details by slug
	server.tool(
		"get_institution",
		"Get full details of a specific approved institution by its slug, including description, address, QR code, social media links, and coordinates.",
		{
			slug: z
				.string()
				.describe("The URL slug of the institution (e.g. masjid-negara)"),
		},
		async ({ slug }) => {
			const [institution] = await db
				.select({
					id: institutions.id,
					name: institutions.name,
					slug: institutions.slug,
					description: institutions.description,
					category: institutions.category,
					state: institutions.state,
					city: institutions.city,
					address: institutions.address,
					qrImage: institutions.qrImage,
					qrContent: institutions.qrContent,
					supportedPayment: institutions.supportedPayment,
					coords: institutions.coords,
					socialMedia: institutions.socialMedia,
				})
				.from(institutions)
				.where(
					and(eq(institutions.slug, slug), eq(institutions.status, "approved")),
				)
				.limit(1);

			if (!institution) {
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify({
								error: "Institution not found",
								slug,
							}),
						},
					],
					isError: true,
				};
			}

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(institution, null, 2),
					},
				],
			};
		},
	);

	// Tool 4: Get random institution
	server.tool(
		"get_random_institution",
		"Returns one random approved institution. Useful for discovering or showcasing institutions.",
		async () => {
			const [institution] = await db
				.select({
					id: institutions.id,
					name: institutions.name,
					slug: institutions.slug,
					category: institutions.category,
					state: institutions.state,
					city: institutions.city,
					qrImage: institutions.qrImage,
					qrContent: institutions.qrContent,
					supportedPayment: institutions.supportedPayment,
					coords: institutions.coords,
				})
				.from(institutions)
				.where(eq(institutions.status, "approved"))
				.orderBy(sql`RANDOM()`)
				.limit(1);

			if (!institution) {
				return {
					content: [
						{
							type: "text" as const,
							text: JSON.stringify({
								error: "No institutions found",
							}),
						},
					],
					isError: true,
				};
			}

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(institution, null, 2),
					},
				],
			};
		},
	);

	return server;
}

async function handleMcpRequest(req: Request): Promise<Response> {
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});

	const server = createServer();

	try {
		await server.connect(transport);
		return await transport.handleRequest(req);
	} finally {
		await server.close();
		await transport.close();
	}
}

export async function GET(req: Request) {
	return handleMcpRequest(req);
}

export async function POST(req: Request) {
	return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
	return handleMcpRequest(req);
}
