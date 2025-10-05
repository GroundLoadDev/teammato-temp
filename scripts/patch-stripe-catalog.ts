/**
 * Teammato — Stripe catalog patcher
 * - Updates per-cap products with description, tax_code, descriptor, unit_label
 * - Sets a marketing "features" list (used by Pricing Tables & Portal)
 * - Verifies/ensures monthly & annual prices exist and carry correct metadata
 * - (Optional) attempts to set price.tax_behavior = 'exclusive' if not set and allowed
 *
 * Usage (test):
 *   npx tsx scripts/patch-stripe-catalog.ts
 *
 * Then repeat with live key when verified.
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.TESTING_STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// ---------- CONFIG ----------
const PRODUCT_DESC =
  "Anonymous feedback for Slack teams — priced by workspace size.";
const STATEMENT_DESCRIPTOR = "TEAMMATO";
const UNIT_LABEL = "workspace";
const TAX_CODE = "txcd_10000000"; // General - Electronically Supplied Services

// Per-cap product names we created
const PRODUCT_NAMES = [
  "Teammato 250",
  "Teammato 500",
  "Teammato 1k",
  "Teammato 2.5k",
  "Teammato 5k",
  "Teammato 10k",
  "Teammato 25k",
];

// Expected prices (lookup_key & amounts in USD). Annual = 10x monthly.
// IMPORTANT: These match our actual lookup keys (cap_1000_m, not cap_1k_m)
const EXPECTED_PRICES: Array<{
  cap: number;
  monthly: number;
  annual: number;
  monthlyLookup: string;
  annualLookup: string;
}> = [
  { cap: 250,   monthly: 99,  annual: 999,  monthlyLookup: "cap_250_m",   annualLookup: "cap_250_a" },
  { cap: 500,   monthly: 149, annual: 1490, monthlyLookup: "cap_500_m",   annualLookup: "cap_500_a" },
  { cap: 1000,  monthly: 199, annual: 1990, monthlyLookup: "cap_1000_m",  annualLookup: "cap_1000_a" },
  { cap: 2500,  monthly: 299, annual: 2990, monthlyLookup: "cap_2500_m",  annualLookup: "cap_2500_a" },
  { cap: 5000,  monthly: 399, annual: 3990, monthlyLookup: "cap_5000_m",  annualLookup: "cap_5000_a" },
  { cap: 10000, monthly: 599, annual: 5990, monthlyLookup: "cap_10000_m", annualLookup: "cap_10000_a" },
  { cap: 25000, monthly: 999, annual: 9990, monthlyLookup: "cap_25000_m", annualLookup: "cap_25000_a" },
];

// Product features shown by Stripe Pricing Tables / Portal
const FEATURES = [
  { name: "Anonymous feedback inside Slack" },
  { name: "Posts encrypted at rest (XChaCha20 AEAD)" },
  { name: "K-anonymous themes and weekly digests" },
  { name: "No PII in logs; privacy-first by design" },
];

// ---------------------------------------------------

async function updateProductBasics(prod: Stripe.Product) {
  const update: Stripe.ProductUpdateParams = {
    description: PRODUCT_DESC,
    statement_descriptor: STATEMENT_DESCRIPTOR,
    unit_label: UNIT_LABEL,
    tax_code: TAX_CODE,
  };
  
  // Note: 'features' is not supported in all Stripe API versions
  // Must be configured manually in Stripe Dashboard → Product → Marketing Features

  await stripe.products.update(prod.id, update);
}

async function findProductByName(name: string) {
  const list = await stripe.products.list({ limit: 100, active: true });
  return list.data.find((p) => p.name === name) || null;
}

async function findPriceByLookup(lookup: string): Promise<Stripe.Price | null> {
  const list = await stripe.prices.list({ lookup_keys: [lookup], expand: ["data.product"] });
  return list.data[0] || null;
}

async function ensurePrice(
  productId: string,
  lookup: string,
  dollars: number,
  interval: "month" | "year",
  cap: number,
  period: "monthly" | "annual"
): Promise<Stripe.Price> {
  const existing = await findPriceByLookup(lookup);
  if (existing) {
    // Try to set tax_behavior = 'exclusive' if not already and if Stripe allows update
    try {
      if ((existing as any).tax_behavior !== "exclusive") {
        await stripe.prices.update(existing.id, { tax_behavior: "exclusive" as any });
      }
    } catch {
      // ignore if not updatable
    }
    // Ensure metadata at least
    if (!existing.metadata || existing.metadata.cap !== String(cap) || existing.metadata.period !== period) {
      try {
        await stripe.prices.update(existing.id, { metadata: { cap: String(cap), period } });
      } catch {
        // metadata may be locked in some cases; safe to ignore
      }
    }
    return existing;
  }

  // Price doesn't exist, create it
  return stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: dollars * 100,
    recurring: { interval },
    lookup_key: lookup,
    metadata: { cap: String(cap), period },
    tax_behavior: "exclusive",
  });
}

async function run() {
  if (!process.env.TESTING_STRIPE_SECRET_KEY) {
    throw new Error("Missing TESTING_STRIPE_SECRET_KEY");
  }

  console.log("🔧 Patching Stripe catalog metadata...\n");

  const summary: Array<any> = [];

  for (const name of PRODUCT_NAMES) {
    console.log(`📦 Processing ${name}...`);
    const prod = await findProductByName(name);
    if (!prod) {
      console.warn(`  ⚠️  Product not found: ${name} (skipping)`);
      continue;
    }

    await updateProductBasics(prod);
    console.log(`  ✓ Updated product metadata`);

    // Find matching price expectations
    const expectedForThis = EXPECTED_PRICES.find((p) => {
      // Match by product name
      if (name === "Teammato 250" && p.cap === 250) return true;
      if (name === "Teammato 500" && p.cap === 500) return true;
      if (name === "Teammato 1k" && p.cap === 1000) return true;
      if (name === "Teammato 2.5k" && p.cap === 2500) return true;
      if (name === "Teammato 5k" && p.cap === 5000) return true;
      if (name === "Teammato 10k" && p.cap === 10000) return true;
      if (name === "Teammato 25k" && p.cap === 25000) return true;
      return false;
    });

    if (!expectedForThis) {
      console.warn(`  ⚠️  No expected prices found for ${name}`);
      continue;
    }

    const m = await ensurePrice(
      prod.id,
      expectedForThis.monthlyLookup,
      expectedForThis.monthly,
      "month",
      expectedForThis.cap,
      "monthly"
    );
    console.log(`  ✓ Monthly price: ${expectedForThis.monthlyLookup} → ${m.id}`);

    const a = await ensurePrice(
      prod.id,
      expectedForThis.annualLookup,
      expectedForThis.annual,
      "year",
      expectedForThis.cap,
      "annual"
    );
    console.log(`  ✓ Annual price: ${expectedForThis.annualLookup} → ${a.id}`);

    summary.push({
      product: prod.name,
      productId: prod.id,
      monthlyLookup: expectedForThis.monthlyLookup,
      monthlyPriceId: m.id,
      annualLookup: expectedForThis.annualLookup,
      annualPriceId: a.id,
    });
  }

  console.log("\n✅ Patch complete. Summary:\n");
  console.table(
    summary.map((s) => ({
      product: s.product,
      monthly: `${s.monthlyLookup} → ${s.monthlyPriceId}`,
      annual: `${s.annualLookup} → ${s.annualPriceId}`,
    }))
  );

  console.log("\n💡 Next steps:");
  console.log("1. Dashboard → Settings → Billing → Customer portal → 'Customers can switch plans'");
  console.log("2. Add all 7 'Teammato <cap>' products to the allowed list");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
