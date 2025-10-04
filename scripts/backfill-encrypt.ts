import { db } from "../server/db";
import { feedbackItems } from "../shared/schema";
import { isNull, and, eq } from "drizzle-orm";
import { encryptFeedbackFields } from "../server/utils/encryptFeedback";
import { cryptoReady } from "../server/utils/encryption";

const BATCH_SIZE = Number(process.env.BACKFILL_BATCH || 100);

async function backfillEncryption() {
  await cryptoReady();
  console.log("Starting encryption backfill...");

  let totalProcessed = 0;
  let hasMore = true;

  while (hasMore) {
    const rows = await db.select()
      .from(feedbackItems)
      .where(isNull(feedbackItems.contentCt))
      .limit(BATCH_SIZE);

    if (rows.length === 0) {
      hasMore = false;
      console.log("No more rows to process.");
      break;
    }

    console.log(`Processing batch of ${rows.length} rows...`);

    for (const row of rows) {
      try {
        const encrypted = await encryptFeedbackFields(
          row.orgId,
          row.threadId,
          row.content || null,
          row.behavior || null,
          row.impact || null
        );

        await db.update(feedbackItems)
          .set({
            contentCt: encrypted.contentCt,
            behaviorCt: encrypted.behaviorCt,
            impactCt: encrypted.impactCt,
            nonce: encrypted.nonce,
            aadHash: encrypted.aadHash,
          })
          .where(eq(feedbackItems.id, row.id));

        totalProcessed++;
      } catch (error) {
        console.error(`Failed to encrypt item ${row.id}:`, error);
      }
    }

    console.log(`Processed ${totalProcessed} items so far...`);
  }

  console.log(`Backfill complete! Total items encrypted: ${totalProcessed}`);
  process.exit(0);
}

backfillEncryption().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
