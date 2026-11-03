import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'
import { approveSubmission } from '@/lib/waitlist'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    const { id } = await context.params
    
    const submission = await prisma.userSubmission.findUnique({
      where: { id }
    })
    
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(submission)
  } catch (error) {
    console.error('Failed to fetch submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

export async function PUT(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    const { id } = await context.params
    
    const body = await _request.json()
    const { status, adminResponse } = body

    // Approving has to reach Clerk too, or the person stays on the waitlist:
    // the middleware opens /party from waitlistStatus, not from this row
    if (status === 'APPROVED') {
      const result = await approveSubmission(id, 'admin')
      if (result.outcome === 'not_found') {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
      }
      if (adminResponse !== undefined) {
        await prisma.userSubmission.update({ where: { id }, data: { adminResponse } })
      }
      // labelSet false: recorded, but Clerk didn't take the label, so they're still
      // locked out; approving again retries it (#752)
      return NextResponse.json({ ...(await prisma.userSubmission.findUnique({ where: { id } })), labelSet: result.labelSet })
    }

    const submission = await prisma.userSubmission.update({
      where: { id },
      data: {
        status,
        adminResponse,
        processedAt: new Date()
      }
    })
    
    return NextResponse.json(submission)
  } catch (error) {
    console.error('Failed to update submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    const { id } = await context.params
    
    await prisma.userSubmission.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}