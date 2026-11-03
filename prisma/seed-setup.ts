import { PrismaClient } from '@prisma/client'
import { seedSetupSteps } from './setup-steps'

// Seeds only the SETUP. curriculum. Safe to re-run against a live database:
// it upserts, and never deletes steps or anyone's progress (unlike seed.ts).
const prisma = new PrismaClient()

seedSetupSteps(prisma)
  .then(({ steps, founderAccess }) => {
    console.log(`SETUP. curriculum seeded: ${steps} steps`)
    console.log(
      founderAccess
        ? '- FOUNDER_USER_ID granted access to SETUP.'
        : '- FOUNDER_USER_ID not set: no one can see SETUP. steps yet (set it and re-run)'
    )
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
