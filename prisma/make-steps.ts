import type { PrismaClient } from '@prisma/client'
import { getPortfolio, type PortfolioItem } from '../src/lib/component-portfolio'

// MAKE. curriculum (#1433): one step per component in the portfolio
// (src/lib/component-portfolio.ts), "make <component> yours". A step links to
// the component's home article once one presents it, and is COMPLETED once
// that article is published, so re-seeding after publishing an article ticks
// it off. A signed-in vote on /build is saved in the voter's progress on the
// step (POST /api/steps/<id>/vote; a MORE. also starts it). Upserted by stable
// id, so re-running never
// touches anyone's progress.

export const MAKE_CATEGORY = {
  name: 'MAKE.',
  description: 'Make each component yours: its own article, on your site.',
  color: '#F9C22E',
}

// After SETUP.'s epoch, so MAKE. lists after it when sorted by createdAt
const MAKE_EPOCH = Date.UTC(2000, 1, 1)

export interface MakeStep {
  id: string
  title: string
  description: string
  link: string | null
  status: 'PENDING' | 'COMPLETED'
  metadata: {
    stepType: 'link-based' | 'action-based'
    order: number
    component: string
    articleSlug: string | null
    doneWhen: 'article-published'
    needs: string[]
  }
}

export function makeSteps(portfolio: PortfolioItem[] = getPortfolio()): MakeStep[] {
  return portfolio.map((item, order) => ({
    id: item.stepId,
    title: `Make ${item.label} yours`,
    description: item.home?.published
      ? `${item.home.blurb} Done: its article is published.`
      : `Write the article that presents ${item.label}: what it does, what it needs, how to use it. Done when it is published.`,
    link: item.home?.published ? `/article/${item.home.slug}` : null,
    status: item.done ? 'COMPLETED' : 'PENDING',
    metadata: {
      stepType: item.home?.published ? 'link-based' : 'action-based',
      order,
      component: item.name,
      articleSlug: item.home?.slug ?? null,
      doneWhen: 'article-published',
      needs: item.needs,
    },
  }))
}

// Upserts the MAKE. category and steps. Like SETUP., CATEGORY_RESTRICTED with
// FOUNDER_USER_ID granted access
export async function seedMakeSteps(prisma: PrismaClient) {
  const category = await prisma.stepCategory.upsert({
    where: { name: MAKE_CATEGORY.name },
    create: MAKE_CATEGORY,
    update: { description: MAKE_CATEGORY.description, color: MAKE_CATEGORY.color },
  })

  const steps = makeSteps()
  for (const step of steps) {
    const data = {
      title: step.title,
      description: step.description,
      category: 'MAKE',
      optional: true,
      link: step.link,
      status: step.status,
      priority: 'MEDIUM' as const,
      visibility: 'CATEGORY_RESTRICTED' as const,
      createdAt: new Date(MAKE_EPOCH + step.metadata.order * 60_000),
      metadata: step.metadata,
    }

    await prisma.step.upsert({ where: { id: step.id }, create: { id: step.id, ...data }, update: data })
    await prisma.stepCategories.upsert({
      where: { A_B: { A: step.id, B: category.id } },
      create: { A: step.id, B: category.id },
      update: {},
    })
  }

  const founderId = process.env.FOUNDER_USER_ID
  if (founderId) {
    await prisma.userCategoryAccess.upsert({
      where: { userId_categoryId: { userId: founderId, categoryId: category.id } },
      create: { userId: founderId, categoryId: category.id },
      update: {},
    })
  }

  return {
    steps: steps.length,
    done: steps.filter((step) => step.status === 'COMPLETED').length,
    founderAccess: Boolean(founderId),
  }
}
