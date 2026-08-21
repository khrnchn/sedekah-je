#!/usr/bin/env bun
/**
 * Backfill missing address and coords for institutions using Google Geocoding API.
 *
 * 2-pass strategy:
 * - Pass A: coords exist, address null → reverse geocode
 * - Pass B: coords null → forward geocode (name, city, state, Malaysia)
 *
 * Usage:
 *   bun run db:backfill-institutions-location -- --dry-run --limit 20
 *   bun run db:backfill-institutions-location -- --commit --limit 20
 *
 * Env: DATABASE_URL, GOOGLE_GEOCODING_API_KEY (required)
 */

import fs from "node:fs";
import path from "node:path";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { env } from "@/env";

const API_KEY = env.GOOGLE_GEOCODING_API_KEY;
const BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const DEFAULT_PAUSE_MS = 200;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

type GoogleStatus =
	| "OK"
	| "ZERO_RESULTS"
	| "OVER_QUERY_LIMIT"
	| "REQUEST_DENIED"
	| "INVALID_REQUEST"
	| "UNKNOWN_ERROR";

type GeocodeResult =
	| { ok: true; address?: string; lat?: number; lng?: number }
	| { ok: false; status: GoogleStatus; errorMessage?: string };

function getArgValue(flag: string): string | null {
	const idx = process.argv.indexOf(flag);
	if (idx === -1 || idx + 1 >= process.argv.length) return null;
	return process.argv[idx + 1] ?? null;
}

function getFlag(flag: string): boolean {
	return process.argv.includes(flag);
}

const limitArg = getArgValue("--limit");
const pauseArg = getArgValue("--pause-ms");
const idsArg = getArgValue("--ids");
const statusArg = getArgValue("--status");

const dryRun = getFlag("--commit") ? false : true;
const overwriteAddress = getFlag("--overwrite-address");
const onlyNullAddress = !getFlag("--no-only-null-address");

const limit = limitArg ? Number.parseInt(limitArg, 10) : 0;
const pauseMs = pauseArg ? Number.parseInt(pauseArg, 10) : DEFAULT_PAUSE_MS;
const idsFilter = idsArg
	? idsArg
			.split(",")
			.map((s) => Number.parseInt(s.trim(), 10))
			.filter((n) => !Number.isNaN(n))
	: null;
const statusFilter =
	statusArg && ["approved", "pending", "rejected", "all"].includes(statusArg)
		? statusArg
		: "all";

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEmptyAddress(addr: string | null | undefined): boolean {
	return addr == null || String(addr).trim() === "";
}

async function fetchWithRetry(
	url: URL,
	retries = MAX_RETRIES,
): Promise<{
	status: GoogleStatus;
	results?: unknown[];
	error_message?: string;
}> {
	let lastErr: Error | null = null;
	for (let i = 0; i <= retries; i++) {
		try {
			const res = await fetch(url.toString(), {
				headers: { Accept: "application/json" },
			});
			const data = (await res.json()) as {
				status: string;
				results?: unknown[];
				error_message?: string;
			};

			const status = data.status as GoogleStatus;
			if (status === "OVER_QUERY_LIMIT" && i < retries) {
				const backoff = INITIAL_BACKOFF_MS * 2 ** i;
				console.warn(`[retry] OVER_QUERY_LIMIT, backing off ${backoff}ms`);
				await sleep(backoff);
				continue;
			}
			if (res.status >= 500 && i < retries) {
				const backoff = INITIAL_BACKOFF_MS * 2 ** i;
				console.warn(`[retry] HTTP ${res.status}, backing off ${backoff}ms`);
				await sleep(backoff);
				continue;
			}

			return {
				status: data.status as GoogleStatus,
				results: data.results,
				error_message: data.error_message,
			};
		} catch (err) {
			lastErr = err instanceof Error ? err : new Error(String(err));
			if (i < retries) {
				const backoff = INITIAL_BACKOFF_MS * 2 ** i;
				console.warn(`[retry] ${lastErr.message}, backing off ${backoff}ms`);
				await sleep(backoff);
			}
		}
	}
	throw lastErr ?? new Error("fetch failed");
}

async function reverseGeocode(
	lat: number,
	lng: number,
): Promise<GeocodeResult> {
	const url = new URL(BASE_URL);
	url.searchParams.set("latlng", `${lat},${lng}`);
	url.searchParams.set("key", API_KEY!);
	url.searchParams.set("language", "ms");

	const { status, results, error_message } = await fetchWithRetry(url);

	if (status !== "OK") {
		return {
			ok: false,
			status,
			errorMessage: error_message,
		};
	}

	const first =
		Array.isArray(results) && results.length > 0 ? results[0] : null;
	if (!first || typeof first !== "object") {
		return { ok: false, status: "ZERO_RESULTS" };
	}

	const r = first as { formatted_address?: string };
	const addr = r.formatted_address ?? "";
	return { ok: true, address: addr || undefined };
}

async function forwardGeocode(
	name: string,
	city: string,
	state: string,
): Promise<GeocodeResult> {
	const query = `${name}, ${city}, ${state}, Malaysia`;
	const url = new URL(BASE_URL);
	url.searchParams.set("address", query);
	url.searchParams.set("key", API_KEY!);
	url.searchParams.set("region", "my");
	url.searchParams.set("language", "ms");

	const { status, results, error_message } = await fetchWithRetry(url);

	if (status !== "OK") {
		return {
			ok: false,
			status,
			errorMessage: error_message,
		};
	}

	const first =
		Array.isArray(results) && results.length > 0 ? results[0] : null;
	if (!first || typeof first !== "object") {
		return { ok: false, status: "ZERO_RESULTS" };
	}

	const r = first as {
		formatted_address?: string;
		geometry?: { location?: { lat?: number; lng?: number } };
	};
	const addr = r.formatted_address ?? "";
	const loc = r.geometry?.location;
	const lat = typeof loc?.lat === "number" ? loc.lat : undefined;
	const lng = typeof loc?.lng === "number" ? loc.lng : undefined;

	if (lat == null || lng == null) {
		return { ok: false, status: "ZERO_RESULTS" };
	}

	return {
		ok: true,
		address: addr || undefined,
		lat,
		lng,
	};
}

async function main() {
	if (!API_KEY?.trim()) {
		console.error("Missing GOOGLE_GEOCODING_API_KEY env var.");
		process.exit(1);
	}

	const conditions: ReturnType<typeof eq>[] = [];

	if (statusFilter !== "all") {
		conditions.push(eq(institutions.status, statusFilter));
	}
	if (idsFilter && idsFilter.length > 0) {
		conditions.push(inArray(institutions.id, idsFilter));
	}

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Pass A: coords exist, address null
	const passACondition = and(
		sql`${institutions.coords} IS NOT NULL`,
		or(isNull(institutions.address), eq(institutions.address, "")),
	);
	const passAWhere = whereClause
		? and(whereClause, passACondition)
		: passACondition;

	const passARows = await db
		.select({
			id: institutions.id,
			name: institutions.name,
			city: institutions.city,
			state: institutions.state,
			address: institutions.address,
			coords: institutions.coords,
		})
		.from(institutions)
		.where(passAWhere)
		.orderBy(institutions.id)
		.limit(limit > 0 ? limit : undefined);

	// Pass B: coords null
	const passBCondition = sql`${institutions.coords} IS NULL`;
	const passBWhere = whereClause
		? and(whereClause, passBCondition)
		: passBCondition;

	const passBRows = await db
		.select({
			id: institutions.id,
			name: institutions.name,
			city: institutions.city,
			state: institutions.state,
			address: institutions.address,
			coords: institutions.coords,
		})
		.from(institutions)
		.where(passBWhere)
		.orderBy(institutions.id)
		.limit(limit > 0 ? limit : undefined);

	console.log(`Pass A (reverse): ${passARows.length} candidates`);
	console.log(`Pass B (forward): ${passBRows.length} candidates`);
	console.log(`Mode: ${dryRun ? "dry-run (no writes)" : "commit"}`);
	console.log("");

	const report: {
		timestamp: string;
		dryRun: boolean;
		passA: { ok: number; miss: number; error: number; updated: string[] };
		passB: { ok: number; miss: number; error: number; updated: string[] };
		misses: Array<{ pass: string; id: number; name: string; reason: string }>;
		errors: Array<{
			pass: string;
			id: number;
			name: string;
			status: string;
			msg?: string;
		}>;
	} = {
		timestamp: new Date().toISOString(),
		dryRun,
		passA: { ok: 0, miss: 0, error: 0, updated: [] },
		passB: { ok: 0, miss: 0, error: 0, updated: [] },
		misses: [],
		errors: [],
	};

	for (const row of passARows) {
		const coords = row.coords as [number, number] | null;
		if (!coords || coords.length < 2) continue;

		const result = await reverseGeocode(coords[0], coords[1]);
		await sleep(pauseMs);

		if (result.ok && result.address) {
			report.passA.ok++;
			if (!dryRun) {
				await db
					.update(institutions)
					.set({ address: result.address })
					.where(eq(institutions.id, row.id));
				report.passA.updated.push(String(row.id));
			}
			console.log(`[ok] A ${row.id} ${row.name} → address`);
		} else if (result.ok === false) {
			if (result.status === "ZERO_RESULTS") {
				report.passA.miss++;
				report.misses.push({
					pass: "A",
					id: row.id,
					name: row.name,
					reason: result.status,
				});
				console.log(`[miss] A ${row.id} ${row.name} (${result.status})`);
			} else {
				report.passA.error++;
				report.errors.push({
					pass: "A",
					id: row.id,
					name: row.name,
					status: result.status,
					msg: result.errorMessage,
				});
				console.error(
					`[error] A ${row.id} ${row.name} ${result.status} ${result.errorMessage ?? ""}`,
				);
			}
		}
	}

	for (const row of passBRows) {
		const result = await forwardGeocode(row.name, row.city, row.state);
		await sleep(pauseMs);

		if (result.ok && result.lat != null && result.lng != null) {
			report.passB.ok++;
			const coords: [number, number] = [result.lat, result.lng];
			const address = result.address ?? "";
			const shouldUpdateAddress =
				overwriteAddress ||
				(onlyNullAddress ? isEmptyAddress(row.address) : true);

			if (!dryRun) {
				await db
					.update(institutions)
					.set({
						coords,
						...(shouldUpdateAddress ? { address } : {}),
					})
					.where(eq(institutions.id, row.id));
				report.passB.updated.push(String(row.id));
			}
			console.log(
				`[ok] B ${row.id} ${row.name} → ${coords[0]}, ${coords[1]}${shouldUpdateAddress ? " + address" : ""}`,
			);
		} else if (result.ok === false) {
			if (result.status === "ZERO_RESULTS") {
				report.passB.miss++;
				report.misses.push({
					pass: "B",
					id: row.id,
					name: row.name,
					reason: result.status,
				});
				console.log(`[miss] B ${row.id} ${row.name} (${result.status})`);
			} else {
				report.passB.error++;
				report.errors.push({
					pass: "B",
					id: row.id,
					name: row.name,
					status: result.status,
					msg: result.errorMessage,
				});
				console.error(
					`[error] B ${row.id} ${row.name} ${result.status} ${result.errorMessage ?? ""}`,
				);
			}
		}
	}

	console.log("");
	console.log("Summary:");
	console.log(
		`  Pass A: ok=${report.passA.ok} miss=${report.passA.miss} error=${report.passA.error}`,
	);
	console.log(
		`  Pass B: ok=${report.passB.ok} miss=${report.passB.miss} error=${report.passB.error}`,
	);

	const reportPath = path.join(
		"/tmp",
		`backfill-institutions-location-${Date.now()}.json`,
	);
	fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
	console.log(`Report: ${reportPath}`);
}

main().catch((err) => {
	console.error("Backfill failed:", err);
	process.exit(1);
});
