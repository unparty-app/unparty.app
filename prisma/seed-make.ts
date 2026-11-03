import { makeSteps, seedMakeSteps } from './make-steps'

// Seeds only the MAKE. curriculum. Safe to re-run against a live database:
// it upserts, and never deletes steps or anyone's progress.
//
//   npm run db:seed:make             write the steps
//   npm run db:seed:make -- --dry-run  print them, no database

if (process.argv.includes('--dry-run')) {
  const steps = makeSteps()
  for (const step of steps) {
    const where = step.link ?? (step.metadata.articleSlug ? `draft: /article/${step.metadata.articleSlug}` : '(no article yet)')
    console.log(`${step.status === 'COMPLETED' ? '✓' : '·'} ${step.id.padEnd(32)} ${where}`)
  }
  console.log(`MAKE. curriculum: ${steps.length} steps, ${steps.filter((s) => s.status === 'COMPLETED').length} done (dry run, nothing written)`)
} else {
  // Imported here so a dry run never creates a database client
  import('@prisma/client').then(async ({ PrismaClient }) => {
    const prisma = new PrismaClient()
    try {
      const { steps, done, founderAccess } = await seedMakeSteps(prisma)
      console.log(`MAKE. curriculum seeded: ${steps} steps, ${done} done`)
      console.log(
        founderAccess
          ? '- FOUNDER_USER_ID granted access to MAKE.'
          : '- FOUNDER_USER_ID not set: no one can see MAKE. steps yet (set it and re-run)'
      )
    } catch (e) {
      console.error(e)
      process.exitCode = 1
    } finally {
      await prisma.$disconnect()
    }
  })
}
