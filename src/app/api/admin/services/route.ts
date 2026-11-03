import { NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin';
import { SETUP_STEPS } from '../../../../../prisma/setup-steps';

export interface ServiceStatus {
  key: string;
  title: string;
  description: string;
  optional: boolean;
  link?: string;
  /** Each env var the step needs and whether it's set. Names only, never values */
  env: { name: string; set: boolean }[];
}

// The SETUP. steps that run on a service (they list env vars), and which of
// those vars this deployment has. Drives the SERVICES. list on /admin
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const services: ServiceStatus[] = SETUP_STEPS.filter((step) => step.env?.length).map((step) => ({
    key: step.key,
    title: step.title,
    description: step.description,
    optional: Boolean(step.optional),
    link: step.link,
    // A choice of vars shows as one row ("A or B"), set when any of them is
    env: (step.env ?? []).map((entry) => {
      const names = Array.isArray(entry) ? entry : [entry];
      return { name: names.join(' or '), set: names.some((name) => Boolean(process.env[name])) };
    }),
  }));

  return NextResponse.json({ services });
}
