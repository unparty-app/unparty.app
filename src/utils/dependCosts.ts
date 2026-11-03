import DependConfig from '../data/DependConfig.json';
import { SETUP_STEPS } from '../../prisma/setup-steps';

/**
 * What a copy of theunpartyapp costs to run: every service it depends on,
 * each tied to the SETUP. step that adds it (prisma/setup-steps.ts).
 *
 * DependConfig.json holds public facts about each vendor (plans, prices, the
 * date they were checked) and is the same for every copy. What the site owner
 * actually pays is theirs, so it lives in FoundersConfig.json `stack`
 * (ownerStack below), never here.
 */

export type PayFrequency = 'once' | 'month' | 'year';

export interface DependFee {
  percent: number;
  fixed: number;
}

export interface DependPlan {
  id: string;
  name: string;
  cost: number;
  payFrequency: PayFrequency;
  note?: string;
  // Pay-as-you-go on top of `cost`, in words ("$0.50 a GB drained")
  usage?: string;
  // A cut of each sale (Polar), on top of `cost`
  fee?: DependFee;
  // The person types the price in (a domain, the search API they connect);
  // `cost` is 0 until they do
  custom?: boolean;
}

export interface DependRequirement {
  depend: string;
  plan: string;
  reason: string;
}

export interface DependConfigEntry {
  id: string;
  name: string;
  // What it is to the site, in a word or two ("sign-in")
  role: string;
  setupStep: string;
  pricingUrl: string;
  // The first plan is where a new copy starts
  plans: DependPlan[];
  // Turning this on moves another depend to a plan (selling needs Vercel Pro)
  requires?: DependRequirement;
}

export interface DependItem extends DependConfigEntry {
  // Required steps have a chapter in the curriculum and are not marked
  // optional (add-an-llm sits in OWN. but is optional)
  required: boolean;
  stepTitle: string;
  // The step's article, once it is live
  href: string | null;
}

export interface OwnerStackEntry {
  plan: string;
  cost: number;
  payFrequency: PayFrequency;
}

/**
 * A feature of theunpartyapp, and the services it needs to work. Required
 * services are always on, so a feature that needs only those always works.
 */
export interface DependFeature {
  id: string;
  name: string;
  what: string;
  needs: string[];
  // The plan a need has to be on, when its first plan isn't enough
  // (build by describing needs Claude Pro: the free plan has no Claude Code)
  plans?: Record<string, string>;
  // The SETUP. article that turns it on
  href: string;
  // What the machine does, in plain words, for the features that use AI
  ai?: string;
}

export const DEPENDS_CHECKED: string = DependConfig.checked;

export const DEPEND_FEATURES = DependConfig.features as DependFeature[];

export function getDependItems(): DependItem[] {
  const steps = new Map(SETUP_STEPS.map((step, order) => [step.key, { step, order }]));

  return (DependConfig.depends as DependConfigEntry[])
    .map(entry => {
      const found = steps.get(entry.setupStep);
      return {
        item: {
          ...entry,
          required: Boolean(found?.step.chapter && !found.step.optional),
          stepTitle: found?.step.title ?? entry.name,
          href: found?.step.link ?? null,
        },
        order: found?.order ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

// A yearly price spread over months; one-time costs are not monthly
export function monthlyCost(cost: number, payFrequency: PayFrequency): number {
  if (payFrequency === 'year') return cost / 12;
  if (payFrequency === 'once') return 0;
  return cost;
}

export function findPlan(item: DependConfigEntry, planId?: string): DependPlan {
  return item.plans.find(plan => plan.id === planId) ?? item.plans[0];
}

export interface StackChoice {
  lens: string | null;
  // Optional services turned on
  on: Iterable<string>;
  // Plan picks that differ from a service's first plan
  plans: Record<string, string>;
  // Prices the person typed in (their domain)
  typed: Record<string, string>;
}

/**
 * A stack as a query string, for handing it to another page (/build):
 * `lens=sell&on=claude,polar&plan=claude:pro&cost=domain:15`. Each part is
 * left out when empty, so the TRY. stack with nothing typed is just `lens=try`.
 */
export function stackSearchParams({ lens, on, plans, typed }: StackChoice): string {
  const params = new URLSearchParams();
  if (lens) params.set('lens', lens);
  const ids = [...on];
  if (ids.length) params.set('on', ids.join(','));
  const picks = Object.entries(plans).filter(([, plan]) => plan);
  if (picks.length) params.set('plan', picks.map(([id, plan]) => `${id}:${plan}`).join(','));
  const costs = Object.entries(typed).filter(([, cost]) => Number.parseFloat(cost) > 0);
  if (costs.length) params.set('cost', costs.map(([id, cost]) => `${id}:${cost}`).join(','));
  return params.toString();
}

/** The other half of stackSearchParams: a stack from /build's query string. */
export function readStackParams(params: URLSearchParams): StackChoice & { on: string[] } {
  const pairs = (key: string) =>
    Object.fromEntries(
      (params.get(key) ?? '')
        .split(',')
        .map((pair) => pair.split(':'))
        .filter(([id, value]) => id && value)
    ) as Record<string, string>;
  return {
    lens: params.get('lens'),
    on: (params.get('on') ?? '').split(',').filter(Boolean),
    plans: pairs('plan'),
    typed: pairs('cost'),
  };
}

export interface StackSummary {
  // Required services plus the optional ones turned on, in curriculum order
  active: DependItem[];
  // Plans moved by another service (selling needs Vercel Pro), and why
  forced: Map<string, { plan: string; reason: string; by: string }>;
  planOf: (item: DependItem) => DependPlan;
  // A plan's price, or what the person typed for a `custom` one
  costOf: (item: DependItem, plan: DependPlan) => number;
  monthly: number;
  yearly: number;
  can: DependFeature[];
  cannot: { feature: DependFeature; missing: string[] }[];
}

/** What a stack costs and builds: shared by BuildYourStack and /build. */
export function summarizeStack({ on, plans, typed }: Omit<StackChoice, 'lens'>, items: DependItem[] = getDependItems()): StackSummary {
  const turnedOn = new Set(on);
  const active = items.filter((item) => item.required || turnedOn.has(item.id));
  const activeIds = new Set(active.map((item) => item.id));
  // The first service to ask for a plan gives the reason
  const forced = new Map<string, { plan: string; reason: string; by: string }>();
  for (const item of active) {
    if (item.requires && !forced.has(item.requires.depend)) {
      forced.set(item.requires.depend, { plan: item.requires.plan, reason: item.requires.reason, by: item.name });
    }
  }
  const planOf = (item: DependItem) => findPlan(item, forced.get(item.id)?.plan ?? plans[item.id]);
  const costOf = (item: DependItem, plan: DependPlan) => {
    if (!plan.custom) return plan.cost;
    const n = Number.parseFloat(typed[item.id] ?? '');
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  let monthly = 0;
  let yearly = 0;
  for (const item of active) {
    const plan = planOf(item);
    const cost = costOf(item, plan);
    if (plan.payFrequency === 'month') monthly += cost;
    if (plan.payFrequency === 'year') yearly += cost;
  }

  const can: DependFeature[] = [];
  const cannot: { feature: DependFeature; missing: string[] }[] = [];
  for (const feature of DEPEND_FEATURES) {
    // Missing: not in the stack, or on a plan the feature can't use
    const missing = feature.needs.filter((id) => {
      if (!activeIds.has(id)) return true;
      const plan = feature.plans?.[id];
      const item = active.find((i) => i.id === id);
      return Boolean(plan && item && planOf(item).id !== plan);
    });
    if (missing.length === 0) can.push(feature);
    else cannot.push({ feature, missing });
  }
  return { active, forced, planOf, costOf, monthly, yearly, can, cannot };
}
