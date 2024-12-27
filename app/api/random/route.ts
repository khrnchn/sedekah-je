import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chrome from '@sparticuz/chromium';
import { institutions } from '@/app/data/institutions';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    if (institutions.length === 0) {
      return NextResponse.json(
        { message: 'No institutions found' },
        { status: 404 }
      );
    }

    const randomIndex = Math.floor(Math.random() * institutions.length);
    const randomInstitution = institutions[randomIndex];

    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

    // configure browser for vercel environment
    const executablePath = process.env.CHROME_EXECUTABLE_PATH || await chrome.executablePath();

    const browser = await puppeteer.launch({
      args: chrome.args,
      executablePath,
      headless: chrome.headless,
    });

    const page = await browser.newPage();

    // set viewport for consistent screenshots
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1,
    });

    await page.goto(`${baseUrl}/qr/${slugify(randomInstitution.name)}`, {
      waitUntil: 'networkidle2',
    });

    const screenshot = await page.screenshot();
    await browser.close();

    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': screenshot.length.toString(),
      }
    });

  } catch (error) {
    console.error('Error fetching random institution:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
