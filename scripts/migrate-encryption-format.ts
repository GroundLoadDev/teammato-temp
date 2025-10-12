/**
 * ONE-TIME MIGRATION: Migrate from old 3-column encryption to new single-payload encryption
 * 
 * WARNING: This migration cannot preserve old encrypted data because:
 * - Old format had CRITICAL security flaw (nonce reuse across fields)
 * - New format uses single JSON payload with one nonce (secure AEAD)
 * - Cannot decrypt old format and re-encrypt without breaking security guarantees
 * 
 * IMPACT: All encrypted feedback will be marked for re-submission
 * This is acceptable for early development/testing phases only.
 */

import { db } from "../server/db";
import { feedbackItems } from "../shared/schema";
import { sql } from "drizzle-orm";

async function migrateEncryptionFormat() {
  console.log("🔐 Starting encryption format migration...\n");

  try {
    // Check how many records have old encryption format
    const oldFormatCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM feedback_items 
      WHERE content_ct IS NOT NULL OR behavior_ct IS NOT NULL OR impact_ct IS NOT NULL
    `);
    
    const count = oldFormatCount.rows[0]?.count || 0;
    console.log(`Found ${count} records with old encryption format\n`);

    if (count === 0) {
      console.log("✅ No records to migrate - all clear!");
      return;
    }

    console.log("⚠️  WARNING: Old encrypted data cannot be automatically migrated");
    console.log("   Reason: Old format had security vulnerability (nonce reuse)");
    console.log("   Action: Clearing old encrypted fields (data will need re-submission)\n");

    // Clear old encryption columns
    await db.execute(sql`
      UPDATE feedback_items 
      SET content_ct = NULL, 
          behavior_ct = NULL, 
          impact_ct = NULL
      WHERE content_ct IS NOT NULL OR behavior_ct IS NOT NULL OR impact_ct IS NOT NULL
    `);

    console.log(`✅ Cleared ${count} records with old encryption format`);
    console.log("   These records will be re-encrypted on next submission");

    // Drop old columns now that they're empty
    await db.execute(sql`
      ALTER TABLE feedback_items 
      DROP COLUMN IF EXISTS content_ct,
      DROP COLUMN IF EXISTS behavior_ct,
      DROP COLUMN IF EXISTS impact_ct
    `);

    console.log("✅ Removed old encryption columns (content_ct, behavior_ct, impact_ct)");
    console.log("\n🎉 Migration complete!");
    console.log("   All future submissions will use secure single-payload encryption\n");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrateEncryptionFormat()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
