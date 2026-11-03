import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { StepVisibility } from '@prisma/client'
import { adminGuard } from '@/lib/admin'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard()
  if (denied) return denied

  try {
    const { id: stepId } = await params
    const { visibility } = await _request.json()

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    if (!Object.values(StepVisibility).includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value' },
        { status: 400 }
      )
    }

    // Update step visibility
    const updatedStep = await prisma.step.update({
      where: { id: stepId },
      data: { visibility },
      select: {
        id: true,
        title: true,
        visibility: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      step: updatedStep
    })

  } catch (error) {
    console.error('Failed to update step visibility:', error)
    return NextResponse.json(
      { error: 'Failed to update visibility' },
      { status: 500 }
    )
  }
}

// Toggle visibility between ALL_USERS and SPECIFIC_USERS (hidden)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard()
  if (denied) return denied

  try {
    const { id: stepId } = await params

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      )
    }

    // Get current step
    const currentStep = await prisma.step.findUnique({
      where: { id: stepId },
      select: { visibility: true }
    })

    if (!currentStep) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      )
    }

    // Toggle visibility between public and hidden
    const newVisibility = currentStep.visibility === 'ALL_USERS' 
      ? 'SPECIFIC_USERS'  // Hidden from all users
      : 'ALL_USERS'       // Visible to all users

    const updatedStep = await prisma.step.update({
      where: { id: stepId },
      data: { visibility: newVisibility },
      select: {
        id: true,
        title: true,
        visibility: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      step: updatedStep,
      toggled: true
    })

  } catch (error) {
    console.error('Failed to toggle step visibility:', error)
    return NextResponse.json(
      { error: 'Failed to toggle visibility' },
      { status: 500 }
    )
  }
}