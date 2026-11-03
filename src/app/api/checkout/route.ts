import { Polar } from "@polar-sh/sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@/lib/auth-stub.server";
import { findProjectByProductId } from "@/lib/projects";
import { CHECKOUT_ON } from "@/app/constants/organization";

/**
 * POST /api/checkout — create an embeddable Polar Checkout Session (#992).
 *
 * Replaces the old unauthenticated GET redirect to Polar's hosted page.
 * The Stats pill POSTs here, then mounts the returned session URL inline
 * with @polar-sh/checkout's PolarEmbedCheckout, so buyers never leave
 * unparty.app.
 *
 * Guards:
 * - Checkout on (FoundersConfig `checkout`, on when missing). Off, the pages
 *   show "build yours" instead, and this answers 403 for anyone who calls it.
 * - Signed-in users only (the founder, today) — anonymous visitors get the
 *   static price-only pill client-side and a 401 here.
 * - `productId` must be a `polarProductId` configured on a project in
 *   FoundersConfig.json or UnpppsConfig.json (src/lib/projects.ts), which
 *   also gives us the owning project for order metadata (`projectId`, plus
 *   `unpppId` for unparty's own unppps) that `/api/webhook/polar` reads.
 *
 * No `successUrl` is set on purpose: Polar then renders its confirmation
 * step inline inside the embed (`success` event fires with `redirect:
 * false`), keeping the whole flow on-site. `/checkout/success` remains as a
 * standalone page but is no longer the required post-purchase path.
 *
 * Prerequisite (Polar dashboard, not code): the serving host must be on the
 * org's embedding allowlist under Settings → Preferences → Embedding, or the
 * embed iframe is refused (`frame-ancestors`).
 */

// Conservative IPv4/IPv6 shape check — geo/currency detection is a nicety,
// never worth failing session creation over a malformed forwarded header.
const IP_RE = /^[0-9a-fA-F.:]{3,45}$/;

export async function POST(req: NextRequest) {
  if (!CHECKOUT_ON) {
    return NextResponse.json({ error: "checkout is off" }, { status: 403 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "sign in to checkout" }, { status: 401 });
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json({ error: "polar not configured" }, { status: 503 });
  }

  let productId: unknown;
  try {
    ({ productId } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "missing productId" }, { status: 400 });
  }

  // Only sell products we actually configured — and recover the project they
  // belong to for webhook reconciliation.
  const project = findProjectByProductId(productId);
  if (!project) {
    return NextResponse.json({ error: "unknown productId" }, { status: 400 });
  }

  try {
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: (process.env.POLAR_SERVER as "production" | "sandbox") ??
        (process.env.NODE_ENV === "production" ? "production" : "sandbox"),
    });

    // The Origin header of this same-origin POST is exactly the origin the
    // embed will be mounted on (what embed.js reports as embed_origin).
    const embedOrigin = req.headers.get("origin") ?? req.nextUrl.origin;

    // Prefill the buyer from their Clerk account so the checkout opens
    // ready to pay, and link the order back to them on Polar's side.
    const user = await currentUser();
    const customerEmail =
      user?.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress;

    // Forward the real client IP so Polar pre-selects billing country and
    // currency (server-created sessions otherwise geolocate our server).
    const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const customerIpAddress = forwardedIp && IP_RE.test(forwardedIp) ? forwardedIp : undefined;

    const checkout = await polar.checkouts.create({
      products: [productId],
      embedOrigin,
      externalCustomerId: userId,
      customerEmail,
      customerName: user?.fullName ?? undefined,
      customerIpAddress,
      metadata: project.source === "unppp"
        ? { projectId: project.id, unpppId: project.id }
        : { projectId: project.id },
    });

    return NextResponse.json({ url: checkout.url });
  } catch {
    return NextResponse.json({ error: "failed to create checkout" }, { status: 502 });
  }
}
