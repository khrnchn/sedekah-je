import { NextResponse } from 'next/server';
import { institutions } from '@/app/data/institutions';

// add this export to disable Next.js response caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    return NextResponse.json(randomInstitution, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
