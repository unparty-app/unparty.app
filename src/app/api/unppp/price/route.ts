import { Polar } from "@polar-sh/sdk";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "missing productId" }, { status: 400 });
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json({ error: "polar not configured" }, { status: 503 });
  }

  try {
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      server: (process.env.POLAR_SERVER as "production" | "sandbox") ??
        (process.env.NODE_ENV === "production" ? "production" : "sandbox"),
    });

    const product = await polar.products.get({ id: productId });
    const price = product.prices.find((p) => !p.isArchived);

    if (!price) {
      return NextResponse.json({ error: "no price" }, { status: 404 });
    }

    let priceAmount: number;
    if (price.amountType === "fixed") {
      priceAmount = price.priceAmount;
    } else if (price.amountType === "custom" && price.minimumAmount != null) {
      priceAmount = price.minimumAmount;
    } else {
      return NextResponse.json({ error: "unsupported price type" }, { status: 404 });
    }

    return NextResponse.json(
      { priceAmount, priceCurrency: price.priceCurrency },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  } catch {
    return NextResponse.json({ error: "failed to fetch price" }, { status: 502 });
  }
}
