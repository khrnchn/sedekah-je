import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
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

    // get random institution
    const randomIndex = Math.floor(Math.random() * institutions.length);
    const randomInstitution = institutions[randomIndex];

    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

    // launch browser
    const browser = await puppeteer.launch({ channel: 'chrome' });
    // create new page
    const page = await browser.newPage();
    // navigate to qr page
    await page.goto(`${baseUrl}/qr/${slugify(randomInstitution.name)}`, {
      waitUntil: 'networkidle2',
    });
    // take screenshot
    const screenshot = await page.screenshot();
    // close browser
    await browser.close();

    // return image response
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
