import { NextResponse } from 'next/server';
import { institutions } from '@/app/data/institutions';

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
        'Cache-Control': 'no-store, max-age=0'
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
