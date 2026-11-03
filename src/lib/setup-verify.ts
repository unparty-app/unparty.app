import 'server-only'
import { readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { completeStepForUser } from '@/lib/step-progress'
import type { UnpartyRefsManifest } from '@/lib/unparty-refs'
import { ICON_DEFAULTS } from '@/app/constants/organization'
import { getTold } from '@/lib/build-tell'
import { SETUP_STEPS, setupStepId } from '../../prisma/setup-steps'

/**
 * The SETUP. steps that check themselves (#589, from #1244 D7), completed for
 * a builder once their check passes: one mechanism, which the onboarding
 * (the challenges that walk a chapter, useSetupProgress) runs for an admin.
 *
 * - A step flagged `autoVerifiable` with `env`: every variable it needs is
 *   set on this deployment (a list inside the list is a choice: any one)
 * - The `brand` step: the unparty references manifest reports none left
 *   (scripts/generate-unparty-refs.js, made by every build and npm run dev)
 * - The `icons` step (pick your defaults): any default icon is picked
 *   (FoundersConfig iconDefaults)
 * - The `tell-unparty` step: unparty.app has counted this build (its
 *   number, kept with the copy's token, src/lib/build-tell.ts)
 *
 * Only ever completes a step, never undoes one: a builder's own tick stands.
 * Steps not seeded on this copy (npm run db:seed:setup) are skipped.
 */

const has = (name: string) => Boolean(process.env[name]?.trim())

function brandDone(): boolean {
  try {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'unpartyRefsManifest.json'), 'utf8')) as UnpartyRefsManifest
    return Boolean(manifest.measured && manifest.done)
  } catch {
    return false
  }
}

/** The ids of the steps whose checks pass on this deployment */
export async function passingSetupSteps(): Promise<string[]> {
  const env = SETUP_STEPS.filter((s) => s.autoVerifiable && s.env?.length && s.env.every((need) => (Array.isArray(need) ? need.some(has) : has(need))))
  const picked = Object.values(ICON_DEFAULTS).some(Boolean)
  const told = Boolean((await getTold())?.number)
  return [
    ...env.map((s) => setupStepId(s.key)),
    ...(brandDone() ? [setupStepId('brand')] : []),
    ...(picked ? [setupStepId('icons')] : []),
    ...(told ? [setupStepId('tell-unparty')] : []),
  ]
}

/** Completes the passing steps for this builder; returns the ids it checked off */
export async function verifySetupForUser(userId: string): Promise<string[]> {
  const passing = await passingSetupSteps()
  const seeded = await prisma.step.findMany({ where: { id: { in: passing } }, select: { id: true } })
  for (const { id } of seeded) {
    await completeStepForUser(userId, id, { completionType: 'auto-verified', verifiedBy: id === setupStepId('brand') ? 'unparty-refs-manifest' : id === setupStepId('icons') ? 'icon-defaults' : id === setupStepId('tell-unparty') ? 'build-told' : 'env' })
  }
  return seeded.map((s) => s.id)
}
