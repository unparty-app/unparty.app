import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-stub.server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { adminGuard } from '@/lib/admin'

export async function GET() {
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

    const repositories = await prisma.repository.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(repositories)
  } catch (error) {
    console.error('Failed to fetch repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied

  try {
    console.log('POST /api/admin/repositories - Starting')
    
    const { userId } = await auth()
    console.log('User ID:', userId)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const { name, url, description } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
      console.log('URL format valid')
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log('About to check for existing repository')
    
    // Check if URL already exists
    const existing = await prisma.repository.findUnique({
      where: { url }
    })

    console.log('Existing repository check result:', existing)

    if (existing) {
      return NextResponse.json(
        { error: 'Repository URL already exists' },
        { status: 409 }
      )
    }

    console.log('About to create repository')

    const repository = await prisma.repository.create({
      data: {
        name,
        url,
        description,
        addedBy: userId
      }
    })

    console.log('Repository created successfully:', repository)

    return NextResponse.json(repository)
  } catch (error) {
    console.error('Failed to create repository:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create repository',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, name, url, description, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      )
    }

    // Validate URL format if provided
    if (url) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        )
      }
    }

    const updateData: Partial<Prisma.RepositoryUpdateInput> = {}
    if (name !== undefined) updateData.name = name
    if (url !== undefined) updateData.url = url
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const repository = await prisma.repository.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(repository)
  } catch (error) {
    console.error('Failed to update repository:', error)
    return NextResponse.json(
      { error: 'Failed to update repository' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Repository ID is required' },
        { status: 400 }
      )
    }

    await prisma.repository.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete repository:', error)
    return NextResponse.json(
      { error: 'Failed to delete repository' },
      { status: 500 }
    )
  }
}