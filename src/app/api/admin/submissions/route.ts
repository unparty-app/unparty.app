import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'
import { usersMissingApprovedLabel } from '@/lib/waitlist'
import { SubmissionStatus, SubmissionType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as SubmissionStatus | null
    const type = searchParams.get('type') as SubmissionType | null
    const userId = searchParams.get('userId')
    
    const skip = (page - 1) * limit
    
    const where = {
      ...(status && { status }),
      ...(type && { type }),
      ...(userId && { userId })
    }
    
    const [submissions, total] = await Promise.all([
      prisma.userSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' }
      }),
      prisma.userSubmission.count({ where })
    ])
    
    // Approved here but missing Clerk's label, so still locked out of /party (#752)
    const missing = await usersMissingApprovedLabel(
      submissions.filter((sub) => sub.status === 'APPROVED').map((sub) => sub.userId)
    )

    return NextResponse.json({
      submissions: submissions.map((sub) => ({
        ...sub,
        lockedOut: sub.status === 'APPROVED' && missing ? missing.has(sub.userId) : false,
      })),
      labelsChecked: missing !== null,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const body = await request.json()
    const { userId, type, content, filePath } = body
    
    const submission = await prisma.userSubmission.create({
      data: {
        userId,
        type,
        content,
        filePath
      }
    })
    
    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Failed to create submission:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}