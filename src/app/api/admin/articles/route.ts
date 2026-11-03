import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminGuard } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const published = searchParams.get('published')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    const where = {
      ...(published !== null && { published: published === 'true' }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { content: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    }
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.article.count({ where })
    ])
    
    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await adminGuard()
    if (denied) return denied
    
    const body = await request.json()
    const { slug, title, description, category, content, published, author } = body
    
    const article = await prisma.article.create({
      data: {
        slug,
        title,
        description,
        category,
        content,
        published: published || false,
        author
      }
    })
    
    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    console.error('Failed to create article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}