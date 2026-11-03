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
    
    const article = await prisma.article.findUnique({
      where: { id }
    })
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(article)
  } catch (error) {
    console.error('Failed to fetch article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
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
    const { slug, title, description, category, content, published, author } = body
    
    const article = await prisma.article.update({
      where: { id },
      data: {
        slug,
        title,
        description,
        category,
        content,
        published,
        author
      }
    })
    
    return NextResponse.json(article)
  } catch (error) {
    console.error('Failed to update article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
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
    
    await prisma.article.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}