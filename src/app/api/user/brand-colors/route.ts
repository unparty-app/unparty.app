import { dbOn, noDatabase } from '@/lib/db-on';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-stub.server';
import { prisma } from '@/lib/prisma';
import type { ParsedCssPalette, ParsedCssBrandInfo } from '@/app/utils/importColorsCss';


export interface SavedBrandColors extends ParsedCssPalette, ParsedCssBrandInfo {
  source: 'uncolor-css';
  savedAt: string;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { brandColors: true },
    });

    return NextResponse.json({ brandColors: userProfile?.brandColors ?? null });
  } catch (error) {
    console.error('Error fetching brand colors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!dbOn()) return noDatabase();

    const data = (await request.json()) as ParsedCssPalette & ParsedCssBrandInfo;
    const { primary, secondary, accent, additional1, additional2, name, tagline, description } = data;

    const brandColors: SavedBrandColors = {
      primary,
      secondary,
      accent,
      additional1,
      additional2,
      name,
      tagline,
      description,
      source: 'uncolor-css',
      savedAt: new Date().toISOString(),
    };

    const userProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: { brandColors: brandColors as object, lastActiveAt: new Date() },
      create: {
        userId,
        userType: 'NON_TECHNICAL_FOUNDER',
        brandColors: brandColors as object,
      },
    });

    return NextResponse.json({ success: true, brandColors: userProfile.brandColors });
  } catch (error) {
    console.error('Error saving brand colors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
