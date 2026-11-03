import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { getAppSetting, setAppSetting, KEYWORD_HIGHLIGHTING_KEY } from '@/lib/appSettings';

export async function GET() {
  try {
    const denied = await adminGuard();
    if (denied) return denied;

    const keywordHighlighting = await getAppSetting(KEYWORD_HIGHLIGHTING_KEY);

    return NextResponse.json({
      keywordHighlightingEnabled: keywordHighlighting !== 'false',
    });
  } catch (error) {
    console.error('Admin settings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;

    const body = await request.json();
    const { keywordHighlightingEnabled } = body;

    if (typeof keywordHighlightingEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'keywordHighlightingEnabled must be a boolean' },
        { status: 400 }
      );
    }

    await setAppSetting(KEYWORD_HIGHLIGHTING_KEY, String(keywordHighlightingEnabled));

    return NextResponse.json({ keywordHighlightingEnabled });
  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
