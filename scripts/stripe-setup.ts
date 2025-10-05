import Stripe from 'stripe';

// Initialize Stripe with test key
const stripe = new Stripe(process.env.TESTING_STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const PRODUCT_ID = 'prod_TBGpuPZxwUmfYl';

const caps = [
  { cap: 250, m: 99, a: 999 },
  { cap: 500, m: 149, a: 1490 },
  { cap: 1000, m: 199, a: 1990 },
  { cap: 2500, m: 299, a: 2990 },
  { cap: 5000, m: 399, a: 3990 },
  { cap: 10000, m: 599, a: 5990 },
  { cap: 25000, m: 999, a: 9990 },
];

async function createPrices() {
  console.log('🚀 Starting Stripe price creation...\n');
  console.log(`Product ID: ${PRODUCT_ID}\n`);

  const results: any[] = [];

  for (const { cap, m, a } of caps) {
    console.log(`Creating prices for ${cap.toLocaleString()} seat cap...`);

    try {
      // Monthly price
      const monthlyPrice = await stripe.prices.create({
        product: PRODUCT_ID,
        currency: 'usd',
        unit_amount: m * 100,
        recurring: { interval: 'month' },
        lookup_key: `cap_${cap}_m`,
        metadata: { 
          cap: cap.toString(), 
          period: 'monthly' 
        },
      });

      console.log(`  ✓ Monthly: ${monthlyPrice.id} (lookup: cap_${cap}_m) - $${m}/mo`);

      // Annual price
      const annualPrice = await stripe.prices.create({
        product: PRODUCT_ID,
        currency: 'usd',
        unit_amount: a * 100,
        recurring: { interval: 'year' },
        lookup_key: `cap_${cap}_a`,
        metadata: { 
          cap: cap.toString(), 
          period: 'annual' 
        },
      });

      console.log(`  ✓ Annual:  ${annualPrice.id} (lookup: cap_${cap}_a) - $${a}/yr\n`);

      results.push({
        cap,
        monthly: { id: monthlyPrice.id, lookup_key: `cap_${cap}_m`, amount: m },
        annual: { id: annualPrice.id, lookup_key: `cap_${cap}_a`, amount: a },
      });
    } catch (error: any) {
      console.error(`  ✗ Error creating prices for ${cap} cap:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`Total prices created: ${results.length * 2}`);
  console.log('\n✅ All prices created successfully!\n');

  // Output formatted table for questionnaire
  console.log('Price Table for Questionnaire:\n');
  console.log('Cap\tMonthly price_id\tlookup_key\tAnnual price_id\tlookup_key');
  for (const r of results) {
    console.log(`${r.cap}\t${r.monthly.id}\t${r.monthly.lookup_key}\t${r.annual.id}\t${r.annual.lookup_key}`);
  }
}

createPrices()
  .then(() => {
    console.log('\n✨ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
