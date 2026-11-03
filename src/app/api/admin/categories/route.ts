import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}
    
    const categories = await prisma.stepCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            StepCategories: true,
            userAccess: true
          }
        }
      }
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Admin categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const body = await request.json()
    const { name, description, color } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }
    
    const category = await prisma.stepCategory.create({
      data: {
        name,
        description: description || null,
        color: color || '#6B7280'
      }
    })
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Admin category creation error:', error)
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}