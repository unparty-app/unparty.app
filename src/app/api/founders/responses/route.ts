import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const founderId = process.env.FOUNDER_USER_ID
    
    if (!founderId) {
      return NextResponse.json([])
    }

    // Get founder's progress on founder questions
    const founderResponses = await prisma.userStepProgress.findMany({
      where: {
        userId: founderId,
        step: {
          StepCategories: {
            some: {
              step_categories: {
                name: {
                  in: ['Core', 'Budget', 'Brand', 'Product', 'Risk', 'Growth']
                }
              }
            }
          }
        }
      },
      include: {
        step: {
          select: {
            id: true,
            title: true,
            metadata: true,
            visibility: true
          }
        }
      },
      orderBy: {
        step: {
          createdAt: 'asc'
        }
      }
    })

    return NextResponse.json(founderResponses)
  } catch (error) {
    console.error('Failed to fetch founder responses:', error)
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
  }
}