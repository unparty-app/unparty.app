import { PrismaClient } from '@prisma/client'
import { seedSetupSteps } from './setup-steps'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.userStepProgress.deleteMany()
  await prisma.userCategoryAccess.deleteMany()
  await prisma.step.deleteMany()
  await prisma.stepCategory.deleteMany()

  // Seed categories first
  const categories = await prisma.stepCategory.createMany({
    data: [
      {
        name: "Onboarding",
        description: "Initial user setup and configuration steps",
        color: "#3B82F6"
      },
      {
        name: "Development",
        description: "Technical development and coding tasks",
        color: "#10B981"
      },
      {
        name: "Business",
        description: "Business planning and strategy steps",
        color: "#F59E0B"
      },
      {
        name: "Marketing",
        description: "Marketing and outreach activities",
        color: "#EF4444"
      },
      // Founders assessment categories
      {
        name: "Core",
        description: "Core business principles and foundational questions",
        color: "#8B5CF6"
      },
      {
        name: "Budget",
        description: "Financial planning and budget management",
        color: "#06B6D4"
      },
      {
        name: "Brand",
        description: "Brand identity and intellectual property",
        color: "#F97316"
      },
      {
        name: "Product",
        description: "Product development and quality assurance",
        color: "#84CC16"
      },
      {
        name: "Risk",
        description: "Risk management and legal considerations",
        color: "#EF4444"
      },
      {
        name: "Growth",
        description: "Growth strategies and scaling plans",
        color: "#10B981"
      }
    ]
  })

  // Get created categories for referencing
  const onboardingCategory = await prisma.stepCategory.findUnique({ where: { name: "Onboarding" }})
  const developmentCategory = await prisma.stepCategory.findUnique({ where: { name: "Development" }})
  const businessCategory = await prisma.stepCategory.findUnique({ where: { name: "Business" }})
  

  // Seed initial steps with categories
  const steps = await Promise.all([
    prisma.step.create({
      data: {
        title: "Build Step",
        description: "Complete the initial build form to get started with your project setup and requirements gathering.",
        category: "BUILD",
        optional: false,
        link: "https://docs.google.com/forms/d/e/1FAIpQLSdndl3NzVqJZctyzHJruwC1bteGUimLm3v9LRU3Eob_5useig/viewform",
        status: "PENDING",
        priority: "HIGH",
        visibility: "ALL_USERS",
        StepCategories: {
          create: onboardingCategory ? [{ B: onboardingCategory.id }] : []
        }
      }
    }),
    prisma.step.create({
      data: {
        title: "Profile Setup",
        description: "Complete your user profile with all necessary information and preferences.",
        category: "ONBOARDING",
        optional: false,
        status: "PENDING",
        priority: "HIGH",
        visibility: "ALL_USERS",
        StepCategories: {
          create: onboardingCategory ? [{ B: onboardingCategory.id }] : []
        }
      }
    }),
    prisma.step.create({
      data: {
        title: "Team Formation",
        description: "Join or create a team for collaborative projects and networking.",
        category: "BUSINESS",
        optional: true,
        status: "PENDING",
        priority: "MEDIUM",
        visibility: "ALL_USERS",
        StepCategories: {
          create: businessCategory ? [{ B: businessCategory.id }] : []
        }
      }
    }),
    prisma.step.create({
      data: {
        title: "Project Submission",
        description: "Submit your first project for review and feedback from the community.",
        category: "DEVELOPMENT",
        optional: false,
        status: "PENDING",
        priority: "MEDIUM",
        visibility: "ALL_USERS",
        StepCategories: {
          create: developmentCategory ? [{ B: developmentCategory.id }] : []
        }
      }
    })
  ])


  // SETUP. curriculum (#1094); re-seed it alone with npm run db:seed:setup
  const setup = await seedSetupSteps(prisma)

  console.log(`Database has been seeded with:`)
  console.log(`- ${categories.count} categories`)
  console.log(`- ${steps.length} initial steps`)
  console.log(`- ${setup.steps} SETUP. steps`)
  console.log(`Note: Questions are seeded separately via the migration script`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })