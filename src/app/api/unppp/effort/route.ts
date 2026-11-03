import { NextResponse } from 'next/server';
import { getUnpppTimelineData, ORG_PROVENANCE } from '@/utils/unpppTimeline';

export async function GET() {
  try {
    const entries = getUnpppTimelineData().map(e => ({
      id: e.id,
      displayName: e.displayName,
      tagline: e.tagline,
      type: e.type,
      colors: e.colors,
      debt: e.debt,
      confidence: e.confidence,
      isPlaceholder: e.isPlaceholder,
      totalHours: e.totalHours,
      hoursBudget: e.hoursBudget,
      hoursShare: e.hoursShare,
      commitCount: e.commitCount,
      sessionCount: e.sessionCount,
      contributorCount: e.contributorCount,
      utilizationRate: e.utilizationRate,
      polarPrice: e.polarPrice,
      commitsPerMonth: e.commitsPerMonth,
      velocityTrend: e.velocityTrend,
      standardsScore: e.standardsScore,
      anchorTimeMs: e.anchorTimeMs,
      firstCommitMs: e.firstCommitMs,
      lastCommitMs: e.lastCommitMs,
      t: e.t,
      demandScore: e.demandScore,
      demandRank: e.demandRank,
      supplyRank: e.supplyRank,
      priorityRank: e.priorityRank,
      investmentDelta: e.investmentDelta,
    }));

    // Ranks only exist over the priced set; clients need the denominator for "#N of M".
    const pricedCount = entries.filter(e => e.demandRank > 0).length;

    return NextResponse.json({
      entries,
      count: entries.length,
      pricedCount,
      provenance: ORG_PROVENANCE,
    });
  } catch (error) {
    console.error('Error computing unppp effort data:', error);
    return NextResponse.json({
      error: 'Failed to load unppp effort data',
      entries: [],
      count: 0
    }, { status: 500 });
  }
}
