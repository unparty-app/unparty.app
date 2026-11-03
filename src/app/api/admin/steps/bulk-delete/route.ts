import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminGuard } from '@/lib/admin';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard();
    if (denied) return denied;
    
    const { stepIds, criteria } = await request.json();
    
    let deleteCount = 0;
    
    if (stepIds && Array.isArray(stepIds)) {
      // Delete specific steps by IDs
      const result = await prisma.step.deleteMany({
        where: {
          id: {
            in: stepIds
          }
        }
      });
      deleteCount = result.count;
    } else if (criteria) {
      // Delete steps based on criteria (for cleaning up old question-steps)
      const whereClause: Prisma.StepWhereInput = {};
      
      if (criteria.hasQuestionMetadata) {
        // Delete steps that have question metadata (old hybrid approach)
        whereClause.metadata = {
          path: ['questionId'],
          not: Prisma.DbNull
        };
      }
      
      if (criteria.titleContains) {
        whereClause.title = {
          contains: criteria.titleContains,
          mode: 'insensitive'
        };
      }
      
      if (criteria.descriptionContains) {
        whereClause.description = {
          contains: criteria.descriptionContains,
          mode: 'insensitive'
        };
      }
      
      if (criteria.createdBefore) {
        whereClause.createdAt = {
          lt: new Date(criteria.createdBefore)
        };
      }
      
      const result = await prisma.step.deleteMany({
        where: whereClause
      });
      deleteCount = result.count;
    }
    
    return NextResponse.json({
      success: true,
      deletedCount: deleteCount,
      message: `Successfully deleted ${deleteCount} step(s)`
    });
    
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete steps' },
      { status: 500 }
    );
  }
}