import { institutions } from "@/app/data/institutions";
import { slugify } from "@/lib/utils";
import chromium from "@sparticuz/chromium";
import { type NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

export async function GET(
	request: NextRequest,
	{ params }: { params: { slug: string } },
) {
	const slug = params.slug;

	const institution = institutions.find(
		(institution) => slugify(institution.name) === slug,
	);

	if (!institution) {
		return new NextResponse("Not found", { status: 404 });
	}

	let browser;
	try {
		// Setup chrome options
		const executablePath = await chromium.executablePath();

		// Launch the browser
		browser = await puppeteer.launch({
			args: chromium.args,
			executablePath,
			headless: chromium.headless,
		});

		const page = await browser.newPage();

		// Set viewport to 1200x630 to match OG image dimensions
		await page.setViewport({ width: 1200, height: 630 });

		// Navigate to the QR page
		await page.goto(`https://sedekah.je/qr/${slug}`, {
			waitUntil: "networkidle2",
		});

		// Take a screenshot
		const buffer = await page.screenshot({ type: "png" });

		// Create a new response with the image
		const response = new NextResponse(buffer);

		// Set the content type to png
		response.headers.set("Content-Type", "image/png");

		// Cache the image for 1 hour
		response.headers.set(
			"Cache-Control",
			"public, max-age=3600, s-maxage=3600",
		);

		return response;
	} catch (error) {
		console.error("Error generating OG image:", error);
		return new NextResponse("Error generating image", { status: 500 });
	} finally {
		if (browser) {
			await browser.close();
		}
	}
}
