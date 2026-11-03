// Syncs computed unppp prices (scripts/polar-pricing.ts's output) into Polar,
// replacing the manual "read the number, paste it into the Polar dashboard"
// step. Polar prices are immutable (Stripe-style): "updating" a price means
// submitting a new price object and omitting the old one from the product's
// `prices` array, which archives it automatically.
//
// Every unppp product currently uses a "custom" (pay-what-you-want) price,
// not "fixed" — confirmed by dry-running this script before it ever wrote
// anything. src/app/api/unppp/price/route.ts, the route the rest of the app
// reads live prices from, already treats a custom price's `minimumAmount` as
// *the* displayed price, so that's the field this script keeps in sync
// (`maximumAmount`/`presetAmount` are carried over unchanged from the
// current price rather than guessed at).
//
// When --apply actually has changes to make, the full diff is posted to
// Slack (SLACK_WEBHOOK_URL, same admin-notification webhook as
// src/app/api/problem/send/route.ts) BEFORE any write happens, so a bad
// price swing is visible the moment it goes out, not discovered later.
//
// Usage:
//   npx tsx scripts/sync-polar-prices.ts              # dry run, all unppps
//   npx tsx scripts/sync-polar-prices.ts theunpartyapi # dry run, one unppp
//   npx tsx scripts/sync-polar-prices.ts --apply       # write, all unppps
//   npx tsx scripts/sync-polar-prices.ts theunpartyapi --apply
//
// Run scripts/polar-pricing.ts first if unparty-polar-unppp-cost-estimate.json
// is stale — this script only reads that file, it doesn't recompute prices.

import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Polar } from "@polar-sh/sdk";
import type { PresentmentCurrency } from "@polar-sh/sdk/models/components/presentmentcurrency.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface UnpppEntry {
  id: string;
  polarProductId?: string | null;
}

interface UnpppsConfig {
  unppps: UnpppEntry[];
}

interface UnpppEstimate {
  id: string;
  name: string;
  price_breakdown: { polar_price: number };
}

interface EstimateOutput {
  unppps: UnpppEstimate[];
}

type NewPrice =
  | { amountType: "fixed"; priceAmount: number; priceCurrency: PresentmentCurrency }
  | { amountType: "custom"; minimumAmount: number; maximumAmount?: number | null; presetAmount?: number | null; priceCurrency: PresentmentCurrency };

interface PendingChange {
  id: string;
  polarProductId: string;
  liveCents: number;
  targetCents: number;
  newPrice: NewPrice;
}

const unpppsConfig: UnpppsConfig = JSON.parse(
  readFileSync(join(__dirname, "..", "src/data/UnpppsConfig.json"), "utf-8")
);
const estimateOutput: EstimateOutput = JSON.parse(
  readFileSync(join(__dirname, "..", "unparty-polar-unppp-cost-estimate.json"), "utf-8")
);

function fmtCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function postSlackDiff(changes: PendingChange[], server: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("(SLACK_WEBHOOK_URL not set — skipping Slack notification)");
    return;
  }

  const MAX_ROWS = 30;
  const rows = changes
    .slice(0, MAX_ROWS)
    .map((c) => `${c.id.padEnd(24)} ${fmtCents(c.liveCents).padStart(10)} → ${fmtCents(c.targetCents).padStart(10)}`)
    .join("\n");
  const overflow = changes.length > MAX_ROWS ? `\n… and ${changes.length - MAX_ROWS} more` : "";

  const payload = {
    text: `🏷️ Polar Price Sync — ${changes.length} update(s) about to apply (server=${server})`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `🏷️ Polar Price Sync — ${changes.length} update(s)` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `server=\`${server}\` — applying now via \`sync-polar-prices.ts\`` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: "```" + rows + overflow + "```" },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) console.error(`Slack notification failed: ${response.status}`);
  } catch (error) {
    console.error("Slack notification failed:", error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const targetId = args.find((a) => !a.startsWith("--"));

  if (!process.env.POLAR_ACCESS_TOKEN) {
    console.error("Error: POLAR_ACCESS_TOKEN not set");
    process.exit(1);
  }

  const server = (process.env.POLAR_SERVER as "production" | "sandbox") ??
    (process.env.NODE_ENV === "production" ? "production" : "sandbox");
  if (apply && server === "production") {
    console.log("⚠  POLAR_SERVER=production — this will write real, live prices.\n");
  }

  const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN, server });

  const targets = unpppsConfig.unppps.filter(
    (u): u is UnpppEntry & { polarProductId: string } =>
      !!u.polarProductId && (!targetId || u.id === targetId)
  );

  if (targetId && targets.length === 0) {
    console.error(`"${targetId}" not found in UnpppsConfig.json (or has no polarProductId)`);
    process.exit(1);
  }

  console.log(
    `${apply ? "APPLYING" : "DRY RUN"} — ${targets.length} unppp(s) with a polarProductId, server=${server}\n`
  );
  console.log(`${"ID".padEnd(28)} ${"LIVE".padStart(10)} ${"COMPUTED".padStart(10)}  ACTION`);
  console.log("─".repeat(70));

  // Pass 1: read-only. Compute every diff and log it, but don't write
  // anything yet — the full set of pending changes needs to go to Slack
  // before any of them actually happen.
  const pending: PendingChange[] = [];

  for (const unppp of targets) {
    const estimate = estimateOutput.unppps.find((e) => e.id === unppp.id);
    if (!estimate) {
      console.log(`${unppp.id.padEnd(28)} ${"".padStart(10)} ${"".padStart(10)}  skip: no cost estimate`);
      continue;
    }
    const targetCents = Math.round(estimate.price_breakdown.polar_price * 100);

    let product;
    try {
      product = await polar.products.get({ id: unppp.polarProductId });
    } catch {
      console.log(`${unppp.id.padEnd(28)} ${"".padStart(10)} ${fmtCents(targetCents).padStart(10)}  skip: product fetch failed`);
      continue;
    }

    const activePrice = product.prices.find((p) => !p.isArchived);
    if (!activePrice) {
      console.log(`${unppp.id.padEnd(28)} ${"none".padStart(10)} ${fmtCents(targetCents).padStart(10)}  skip: no active price`);
      continue;
    }

    let liveCents: number;
    let newPrice: NewPrice;

    if (activePrice.amountType === "fixed") {
      liveCents = activePrice.priceAmount;
      newPrice = {
        amountType: "fixed",
        priceAmount: targetCents,
        priceCurrency: activePrice.priceCurrency as PresentmentCurrency,
      };
    } else if (activePrice.amountType === "custom") {
      liveCents = activePrice.minimumAmount;
      newPrice = {
        amountType: "custom",
        minimumAmount: targetCents,
        maximumAmount: activePrice.maximumAmount,
        presetAmount: activePrice.presetAmount,
        priceCurrency: activePrice.priceCurrency as PresentmentCurrency,
      };
    } else {
      console.log(`${unppp.id.padEnd(28)} ${"?".padStart(10)} ${fmtCents(targetCents).padStart(10)}  skip: unsupported price type (${activePrice.amountType})`);
      continue;
    }

    if (liveCents === targetCents) {
      console.log(`${unppp.id.padEnd(28)} ${fmtCents(liveCents).padStart(10)} ${fmtCents(targetCents).padStart(10)}  unchanged`);
      continue;
    }

    console.log(`${unppp.id.padEnd(28)} ${fmtCents(liveCents).padStart(10)} ${fmtCents(targetCents).padStart(10)}  ${apply ? "pending" : "would update"}`);
    pending.push({ id: unppp.id, polarProductId: unppp.polarProductId, liveCents, targetCents, newPrice });
  }

  console.log("");

  if (!apply) {
    console.log("Dry run only — pass --apply to write changes.");
    return;
  }

  if (pending.length === 0) {
    console.log("Nothing to apply.");
    return;
  }

  // Pass 2: notify, then write.
  await postSlackDiff(pending, server);

  for (const change of pending) {
    console.log(`Updating ${change.id}…`);
    await polar.products.update({
      id: change.polarProductId,
      productUpdate: { prices: [change.newPrice] },
    });
  }

  console.log(`\nApplied ${pending.length} price update(s).`);
}

main();
