import { Webhooks } from "@polar-sh/nextjs";
import { NextResponse } from "next/server";
import { clerkClient } from "@/lib/auth-stub.server";

// Validate required environment variables
const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.warn('POLAR_WEBHOOK_SECRET is not set. Polar webhooks will not work.');
}

export const POST = webhookSecret
  ? Webhooks({
      webhookSecret: webhookSecret,
      onPayload: async (payload) => {
        // Log webhook event for debugging
        console.log('Polar webhook received:', payload.type);
      },
      onOrderPaid: async (payload) => {
        const order = payload.data;
        // metadata is propagated from checkout to order by Polar
        const rawMeta = order.metadata as Record<string, string | number | boolean> | undefined;
        const meta = rawMeta && Object.keys(rawMeta).length > 0
          ? Object.fromEntries(Object.entries(rawMeta).map(([k, v]) => [k, String(v)])) as Record<string, string>
          : undefined;

        console.log('[polar:onOrderPaid]', { orderId: order.id, meta });

        // Record the purchase on the buyer's Clerk account, the same way a
        // waitlist approval sets waitlistStatus (api/github/webhook). Checkout
        // sets externalCustomerId to the Clerk user ID (api/checkout), and Polar
        // returns it as customer.externalId. Delivery itself (a repo invite, a
        // download, a license key) is a benefit attached to the product in Polar.
        const userId = order.customer?.externalId;
        const productId = order.productId;
        if (userId && productId) {
          try {
            const client = await clerkClient();
            const user = await client.users.getUser(userId);
            const previous = user.publicMetadata?.purchasedProductIds;
            const purchased = Array.isArray(previous) ? previous.filter((id): id is string => typeof id === 'string') : [];
            if (!purchased.includes(productId)) {
              await client.users.updateUserMetadata(userId, {
                publicMetadata: { purchasedProductIds: [...purchased, productId] },
              });
            }
            console.log('[polar:onOrderPaid] recorded purchase', {
              orderId: order.id,
              productId,
              projectId: meta?.projectId ?? meta?.unpppId,
            });
          } catch (clerkError) {
            // Non-fatal: Polar has the order and delivers its benefits either way
            console.error('[polar:onOrderPaid] failed to record purchase on Clerk user (non-fatal):', clerkError);
          }
        }
      },
      onSubscriptionCreated: async (payload) => {
        // Handle new subscription
        console.log('Subscription created:', payload.data.id);
      },
      onSubscriptionActive: async (payload) => {
        // Handle subscription becoming active
        console.log('Subscription active:', payload.data.id);
      },
      onSubscriptionCanceled: async (payload) => {
        // Handle subscription cancellation
        console.log('Subscription canceled:', payload.data.id);
      },
      onCheckoutCreated: async (payload) => {
        // Handle checkout creation (optional tracking)
        console.log('Checkout created:', payload.data.id);
      },
    })
  : () => NextResponse.json(
      { error: 'Polar webhooks are not configured. Please set POLAR_WEBHOOK_SECRET.' },
      { status: 503 }
    );
