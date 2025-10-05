/**
 * Teammato Stripe Catalog Seeder — One product per cap
 * Creates one product per seat cap + two prices (monthly/annual) with correct lookup_keys and metadata.
 * Safe to run multiple times (idempotent).
 * 
 * Usage:
 *   npx tsx scripts/seed-stripe-catalog.ts seed
 *   npx tsx scripts/seed-stripe-catalog.ts archive-old prod_TBGpuPZxwUmfYl
 */

import Stripe from "stripe";

// -------------------- Config --------------------
const CURRENCY = "usd" as const;
const TAX_CODE = "txcd_10000000"; // Electronically Supplied Services
const PRODUCT_DESC = "Anonymous feedback for Slack teams — priced by workspace size.";
const STATEMENT_DESCRIPTOR = "TEAMMATO";
const UNIT_LABEL = "workspace";

// Seat caps and amounts (USD). Annual = 10x monthly.
const CAPS: Array<{ cap: number; monthly: number; annual: number; name: string }> = [
  { cap: 250, monthly: 99, annual: 999, name: "Teammato 250" },
  { cap: 500, monthly: 149, annual: 1490, name: "Teammato 500" },
  { cap: 1000, monthly: 199, annual: 1990, name: "Teammato 1k" },
  { cap: 2500, monthly: 299, annual: 2990, name: "Teammato 2.5k" },
  { cap: 5000, monthly: 399, annual: 3990, name: "Teammato 5k" },
  { cap: 10000, monthly: 599, annual: 5990, name: "Teammato 10k" },
  { cap: 25000, monthly: 999, annual: 9990, name: "Teammato 25k" },
];

// -------------------- Script plumbing --------------------
const stripe = new Stripe(process.env.TESTING_STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

type Mode = "seed" | "archive-old";
const mode = (process.argv[2] || "seed") as Mode;
const oldProductId = process.argv[3];

async function findProductByName(name: string) {
  const list = await stripe.products.list({ active: true, limit: 100 });
  return list.data.find((p) => p.name === name) || null;
}

async function ensureProduct(name: string) {
  const existing = await findProductByName(name);
  if (existing) {
    console.log(`  Product exists: ${existing.id} (${name})`);
    return existing;
  }

  console.log(`  Creating product: ${name}`);
  return stripe.products.create({
    name,
    description: PRODUCT_DESC,
    statement_descriptor: STATEMENT_DESCRIPTOR,
    unit_label: UNIT_LABEL,
    tax_code: TAX_CODE,
    active: true,
  });
}

async function findPriceByLookup(lookup_key: string) {
  const list = await stripe.prices.list({
    lookup_keys: [lookup_key],
    expand: ["data.product"],
  });
  return list.data[0] || null;
}

async function ensurePrice(opts: {
  product: string;
  unit_amount: number; // dollars
  interval: "month" | "year";
  lookup_key: string;
  cap: number;
  period: "monthly" | "annual";
}) {
  const existing = await findPriceByLookup(opts.lookup_key);
  if (existing) {
    console.log(`    Price exists: ${existing.id} (${opts.lookup_key})`);
    return existing;
  }
  
  console.log(`    Creating price: ${opts.lookup_key} - $${opts.unit_amount}/${opts.interval}`);
  return stripe.prices.create({
    product: opts.product,
    currency: CURRENCY,
    unit_amount: opts.unit_amount * 100,
    recurring: { interval: opts.interval },
    lookup_key: opts.lookup_key,
    metadata: { cap: String(opts.cap), period: opts.period },
  });
}

function formatCapKey(cap: number) {
  // create human-friendly lookup keys that match our earlier convention
  // 2500 -> "2500", 1000 -> "1000", 250 -> "250"
  return String(cap);
}

async function seed() {
  console.log("🚀 Seeding Stripe catalog (one product per cap)...\n");
  
  const summary: Array<{
    product: string;
    productId: string;
    monthlyLookup: string;
    annualLookup: string;
    monthlyPriceId: string;
    annualPriceId: string;
  }> = [];

  for (const tier of CAPS) {
    console.log(`\n📦 Processing ${tier.name} (cap: ${tier.cap})...`);
    const product = await ensureProduct(tier.name);

    const monthlyLookup = `cap_${formatCapKey(tier.cap)}_m`;
    const annualLookup = `cap_${formatCapKey(tier.cap)}_a`;

    const pM = await ensurePrice({
      product: product.id,
      unit_amount: tier.monthly,
      interval: "month",
      lookup_key: monthlyLookup,
      cap: tier.cap,
      period: "monthly",
    });

    const pA = await ensurePrice({
      product: product.id,
      unit_amount: tier.annual,
      interval: "year",
      lookup_key: annualLookup,
      cap: tier.cap,
      period: "annual",
    });

    summary.push({
      product: product.name,
      productId: product.id,
      monthlyLookup,
      annualLookup,
      monthlyPriceId: pM.id,
      annualPriceId: pA.id,
    });
  }

  console.log("\n✅ Catalog seeded/verified. Summary:\n");
  console.table(summary);
  console.log("\n💡 Next steps:");
  console.log("1. Add these products to Stripe Customer Portal 'Customers can switch plans' list");
  console.log("2. Run: npx tsx scripts/seed-stripe-catalog.ts archive-old prod_TBGpuPZxwUmfYl");
}

async function archiveOld(productId: string) {
  if (!productId) {
    throw new Error("Missing old product ID. Usage: npx tsx scripts/seed-stripe-catalog.ts archive-old prod_XXXX");
  }
  
  console.log(`\n🗄️  Archiving prices from old product: ${productId}...\n`);
  
  // First, clear the default price from the product
  try {
    await stripe.products.update(productId, { default_price: null as any });
    console.log("  ✓ Cleared default price from product\n");
  } catch (error: any) {
    console.log(`  ⚠️  Could not clear default price: ${error.message}\n`);
  }
  
  const prices = await stripe.prices.list({
    product: productId,
    limit: 100,
  });
  
  let archived = 0;
  for (const p of prices.data) {
    if (p.active) {
      try {
        await stripe.prices.update(p.id, { active: false });
        console.log(`  ✓ Archived: ${p.id} (${p.lookup_key || "no lookup key"})`);
        archived++;
      } catch (error: any) {
        console.log(`  ✗ Failed to archive ${p.id}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n✅ Archived ${archived} old prices.`);
  console.log("   (Product stays active for historical invoices)");
}

// -------------------- Run --------------------
(async () => {
  if (!process.env.TESTING_STRIPE_SECRET_KEY) {
    throw new Error("Missing TESTING_STRIPE_SECRET_KEY");
  }

  if (mode === "seed") {
    await seed();
  } else if (mode === "archive-old") {
    await archiveOld(oldProductId);
  } else {
    console.error("Unknown mode. Usage:");
    console.error("  npx tsx scripts/seed-stripe-catalog.ts seed");
    console.error("  npx tsx scripts/seed-stripe-catalog.ts archive-old prod_XXXX");
    process.exit(1);
  }
})();
