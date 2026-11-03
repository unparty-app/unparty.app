import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    const { id } = await context.params
    
    const step = await prisma.step.findUnique({
      where: { id }
    })
    
    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(step)
  } catch (error) {
    console.error('Failed to fetch step:', error)
    return NextResponse.json(
      { error: 'Failed to fetch step' },
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
    const { title, description, optional, status, priority, dueDate } = body
    
    const step = await prisma.step.update({
      where: { id },
      data: {
        title,
        description,
        optional,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })
    
    return NextResponse.json(step)
  } catch (error) {
    console.error('Failed to update step:', error)
    return NextResponse.json(
      { error: 'Failed to update step' },
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
    
    await prisma.step.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete step:', error)
    return NextResponse.json(
      { error: 'Failed to delete step' },
      { status: 500 }
    )
  }
}