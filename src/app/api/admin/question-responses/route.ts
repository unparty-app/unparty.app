import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'
import { UserQuestionResponse } from '@prisma/client'
import { adminGuard } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied

  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoryFilter = searchParams.get('categoryId')

    // Get all questions with their steps (categories) and responses
    const questions = await prisma.question.findMany({
      where: categoryFilter ? {
        step: {
          category: categoryFilter.toUpperCase()
        }
      } : undefined,
      include: {
        step: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        responses: true
      },
      orderBy: [
        { step: { category: 'asc' } },
        { order: 'asc' }
      ]
    })

    // Get all unique user IDs and organization IDs from responses
    const allResponses = questions.flatMap(q => q.responses)
    const uniqueUserIds = [...new Set(allResponses.map(r => r.userId))]
    const uniqueOrgIds = [...new Set(allResponses.map(r => r.organizationId).filter((id): id is string => Boolean(id)))]
    
    // Fetch user and organization details from Clerk
    const client = await clerkClient()
    const userDetails = new Map()
    const orgDetails = new Map()
    
    try {
      // Fetch user details
      for (const userId of uniqueUserIds) {
        try {
          const user = await client.users.getUser(userId)
          userDetails.set(userId, {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
          })
        } catch {
          // If user not found in Clerk, use fallback
          userDetails.set(userId, {
            firstName: 'Unknown',
            lastName: 'User',
            email: 'unknown@example.com'
          })
        }
      }

      // Fetch organization details
      for (const orgId of uniqueOrgIds) {
        try {
          const org = await client.organizations.getOrganization({ organizationId: orgId })
          orgDetails.set(orgId, {
            name: org.name,
            slug: org.slug
          })
        } catch {
          // If organization not found in Clerk, use fallback
          orgDetails.set(orgId, {
            name: 'Unknown Organization',
            slug: 'unknown-org'
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user/organization details from Clerk:', error)
    }

    // Group responses by category and question
    const groupedResponses: Record<string, Record<string, {
      questionText: string,
      questionType: string,
      responses: (UserQuestionResponse & { 
        organizationContext?: string
        userDetails?: {
          firstName: string
          lastName: string
          email: string
        }
        organizationDetails?: {
          name: string
          slug: string
        }
      })[]
    }>> = {}
    let totalResponses = 0

    questions.forEach((question) => {
      const categoryId = question.step.category
      const questionId = question.id

      if (!groupedResponses[categoryId]) {
        groupedResponses[categoryId] = {}
      }

      // Add organization context, user details, and organization details to responses for admin display
      const responsesWithContext = question.responses.map(response => ({
        ...response,
        organizationContext: response.organizationId 
          ? orgDetails.get(response.organizationId)?.name || `Org: ${response.organizationId.slice(0, 8)}...`
          : 'Personal',
        userDetails: userDetails.get(response.userId),
        organizationDetails: response.organizationId ? orgDetails.get(response.organizationId) : undefined
      }))

      groupedResponses[categoryId][questionId] = {
        questionText: question.text,
        questionType: question.type,
        responses: responsesWithContext
      }

      totalResponses += question.responses.length
    })

    // Get category summaries
    const categorySummaries = await prisma.step.findMany({
      where: categoryFilter ? {
        category: categoryFilter.toUpperCase()
      } : undefined,
      include: {
        questions: {
          include: {
            _count: {
              select: {
                responses: true
              }
            }
          }
        },
        _count: {
          select: {
            userProgress: true
          }
        }
      },
      orderBy: {
        category: 'asc'
      }
    })

    return NextResponse.json({
      totalResponses,
      groupedResponses,
      categorySummaries: categorySummaries.map(step => ({
        category: step.category,
        title: step.title,
        description: step.description,
        totalQuestions: step.questions.length,
        totalResponses: step.questions.reduce((sum, q) => sum + q._count.responses, 0),
        usersStarted: step._count.userProgress
      })),
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        category: q.step.category,
        responseCount: q.responses.length
      }))
    })
  } catch (error) {
    console.error('Failed to fetch admin responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}