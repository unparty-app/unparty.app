import { setupStepId } from '../../prisma/setup-steps';
import { getPortfolio } from '@/lib/component-portfolio';
import {
  DEPEND_FEATURES,
  findPlan,
  getDependItems,
  summarizeStack,
  type DependItem,
  type StackChoice,
  type StackSummary,
} from './dependCosts';

/**
 * Goals for GoalBudget: something to build (one of DependConfig's features)
 * or an upgrade (a service's paid plan), and the path to it from the stack
 * someone has now. Every goal is computed from DependConfig and the SETUP.
 * steps, so adding a feature, plan or step adds or changes a goal.
 */

export type GoalKind = 'build' | 'upgrade';

export interface Goal {
  id: string;
  kind: GoalKind;
  name: string;
  // build: the feature; upgrade: the service and plan
  featureId?: string;
  depend?: string;
  plan?: string;
}

export interface Milestone {
  // The SETUP. step that is this milestone, saved in the person's progress
  stepId: string;
  title: string;
  href: string | null;
  service: DependItem;
}

export interface GoalPath {
  goal: Goal;
  now: StackSummary;
  then: StackSummary;
  // The stack at the goal, to hand to /build or the stack builder
  target: Omit<StackChoice, 'lens'> & { on: string[] };
  milestones: Milestone[];
  // Plans that move with it (selling moves Vercel to Pro), and why
  comesWith: { service: string; plan: string; reason: string }[];
  // What the goal adds, the way each is billed: a month, and a year
  monthlyDelta: number;
  yearlyDelta: number;
  // A cut per sale or usage the goal adds
  extras: string[];
  unlocks: { features: string[]; components: string[] };
  // The stack builds this already (a build goal) or is on this plan (an upgrade)
  reached: boolean;
}

const ITEMS = getDependItems();
const BY_ID = new Map(ITEMS.map((item) => [item.id, item]));
const PORTFOLIO = getPortfolio();

export const GOALS: Goal[] = [
  ...DEPEND_FEATURES.map((feature) => ({ id: `build-${feature.id}`, kind: 'build' as const, name: feature.name, featureId: feature.id })),
  ...ITEMS.flatMap((item) =>
    item.plans
      .slice(1)
      .filter((plan) => plan.cost > 0 || plan.usage)
      .map((plan) => ({ id: `upgrade-${item.id}-${plan.id}`, kind: 'upgrade' as const, name: `move ${item.name} to ${plan.name}`, depend: item.id, plan: plan.id }))
  ),
];

export const findGoal = (id: string | null | undefined) => GOALS.find((goal) => goal.id === id);

export function goalPath(goal: Goal, choice: Omit<StackChoice, 'lens'>): GoalPath {
  const now = summarizeStack(choice, ITEMS);
  const feature = DEPEND_FEATURES.find((f) => f.id === goal.featureId);
  const needs = goal.kind === 'build' ? feature?.needs ?? [] : goal.depend ? [goal.depend] : [];
  const target = {
    on: [...new Set([...choice.on, ...needs.filter((id) => !BY_ID.get(id)?.required)])],
    plans:
      goal.kind === 'upgrade' && goal.depend && goal.plan
        ? { ...choice.plans, [goal.depend]: goal.plan }
        : { ...choice.plans, ...(feature?.plans ?? {}) },
    typed: { ...choice.typed },
  };
  const then = summarizeStack(target, ITEMS);

  // One milestone per service the goal needs, in curriculum order
  const milestones = ITEMS.filter((item) => needs.includes(item.id)).map((service) => ({
    stepId: setupStepId(service.setupStep),
    title: service.stepTitle,
    href: service.href,
    service,
  }));

  const comesWith = [...then.forced.entries()]
    .filter(([id, forced]) => now.forced.get(id)?.plan !== forced.plan && !needs.includes(id))
    .map(([id, forced]) => ({ service: BY_ID.get(id)?.name ?? id, plan: findPlan(BY_ID.get(id)!, forced.plan).name, reason: forced.reason }));

  const extras: string[] = [];
  for (const item of then.active) {
    const plan = then.planOf(item);
    const before = now.active.includes(item) ? now.planOf(item) : null;
    if (plan.fee && !before?.fee) extras.push(`${plan.fee.percent}% + ${plan.fee.fixed < 1 ? `${Math.round(plan.fee.fixed * 100)}¢` : `$${plan.fee.fixed}`} a sale to ${item.name}`);
    if (plan.usage && before?.usage !== plan.usage) extras.push(`usage on ${item.name}: ${plan.usage}`);
  }

  const canNow = new Set(now.can.map((f) => f.id));
  const nowIds = new Set(now.active.map((item) => item.id));
  const thenIds = new Set(then.active.map((item) => item.id));
  const runs = (ids: Set<string>, needs: string[]) => needs.every((id) => ids.has(id));

  return {
    goal,
    now,
    then,
    target,
    milestones,
    comesWith,
    monthlyDelta: then.monthly - now.monthly,
    yearlyDelta: then.yearly - now.yearly,
    extras,
    reached: goal.kind === 'build' ? canNow.has(goal.featureId ?? '') && then.monthly === now.monthly && then.yearly === now.yearly : now.planOf(BY_ID.get(goal.depend ?? '')!)?.id === goal.plan,
    unlocks: {
      // (a build goal's own feature isn't news)
      features: then.can.filter((f) => !canNow.has(f.id) && f.id !== goal.featureId).map((f) => f.name),
      components: PORTFOLIO.filter((c) => runs(thenIds, c.needs) && !runs(nowIds, c.needs)).map((c) => c.label),
    },
  };
}

/** Where to start: the first feature this stack can't build yet, else the first upgrade. */
export function firstGoal(choice: Omit<StackChoice, 'lens'>): Goal {
  const can = new Set(summarizeStack(choice, ITEMS).can.map((f) => f.id));
  return GOALS.find((goal) => goal.kind === 'build' && goal.featureId && !can.has(goal.featureId)) ?? GOALS.find((g) => g.kind === 'upgrade') ?? GOALS[0];
}
