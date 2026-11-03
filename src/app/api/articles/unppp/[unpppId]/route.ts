import { NextRequest, NextResponse } from 'next/server';
import { getEditorialArticlesForUnppp } from '../../../../constants/editorial-articles';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ unpppId: string }> }
) {
  try {
    const { unpppId } = await params;
    
    // Get MD articles for this UNPPP
    const articles = getEditorialArticlesForUnppp(unpppId);
    
    return NextResponse.json({
      articles,
      count: articles.length,
      unpppId
    });
    
  } catch (error) {
    console.error('Error loading UNPPP articles:', error);
    return NextResponse.json({ 
      error: 'Failed to load articles',
      articles: [],
      count: 0 
    }, { status: 500 });
  }
}