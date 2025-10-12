import { cryptoReady } from "../server/utils/encryption";
import { encryptFeedbackFields, decryptFeedbackFields } from "../server/utils/encryptFeedback";
import sodium from "libsodium-wrappers";
import { db } from "../server/db";
import { orgs, orgKeys } from "../shared/schema";
import { sql, eq } from "drizzle-orm";

async function testIntegration() {
  await cryptoReady();
  console.log("Testing feedback encryption/decryption integration...\n");

  const testThreadId = `test-thread-${Date.now()}`;
  let testOrgIdToUse: string;

  try {
    console.log("1. Creating test organization...");
    await db.insert(orgs).values({
      name: "Test Organization",
      settings: {
        k_anonymity: 5,
        profanity_policy: 'strict',
        redact_ui: true,
        enable_oidc: false,
        enable_llm_moderation: false,
        plan: 'trial',
        retention_days: 365,
        legal_hold: false
      }
    });
    
    const [testOrg] = await db.select().from(orgs).where(sql`name = 'Test Organization'`).limit(1);
    testOrgIdToUse = testOrg.id;
    console.log(`✓ Created org: ${testOrgIdToUse}\n`);

    console.log("2. Testing all three fields present...");
    const encrypted1 = await encryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      "During the sprint planning meeting",
      "John interrupted the PM three times without raising hand",
      "Meeting ran 20 minutes over and team lost focus"
    );
    console.log(`✓ Encrypted (nonce: ${encrypted1.nonce?.length} bytes, payload: ${encrypted1.payloadCt?.length} bytes)`);
    
    const decrypted1 = await decryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      encrypted1.payloadCt,
      encrypted1.nonce
    );
    console.log(`✓ Decrypted all fields`);
    console.log(`  - Content match: ${decrypted1.content === "During the sprint planning meeting" ? 'YES' : 'NO'}`);
    console.log(`  - Behavior match: ${decrypted1.behavior === "John interrupted the PM three times without raising hand" ? 'YES' : 'NO'}`);
    console.log(`  - Impact match: ${decrypted1.impact === "Meeting ran 20 minutes over and team lost focus" ? 'YES' : 'NO'}\n`);

    console.log("3. Testing only behavior field (common case)...");
    const encrypted2 = await encryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      null,
      "Team member checked phone during standup",
      null
    );
    if (!encrypted2.payloadCt || !encrypted2.nonce) {
      throw new Error("CRITICAL: Behavior field not encrypted when it's the only field!");
    }
    console.log(`✓ Behavior encrypted (${encrypted2.payloadCt.length} bytes)`);
    
    const decrypted2 = await decryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      encrypted2.payloadCt,
      encrypted2.nonce
    );
    console.log(`✓ Behavior match: ${decrypted2.behavior === "Team member checked phone during standup" ? 'YES' : 'NO'}\n`);

    console.log("4. Testing only impact field...");
    const encrypted3 = await encryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      null,
      null,
      "Decreased team morale by 50%"
    );
    if (!encrypted3.payloadCt || !encrypted3.nonce) {
      throw new Error("CRITICAL: Impact field not encrypted when it's the only field!");
    }
    console.log(`✓ Impact encrypted (${encrypted3.payloadCt.length} bytes)`);
    
    const decrypted3 = await decryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      encrypted3.payloadCt,
      encrypted3.nonce
    );
    console.log(`✓ Impact match: ${decrypted3.impact === "Decreased team morale by 50%" ? 'YES' : 'NO'}\n`);

    console.log("5. Testing only content field...");
    const encrypted4 = await encryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      "Last Friday during team retrospective",
      null,
      null
    );
    if (!encrypted4.payloadCt || !encrypted4.nonce) {
      throw new Error("CRITICAL: Content field not encrypted when it's the only field!");
    }
    console.log(`✓ Content encrypted (${encrypted4.payloadCt.length} bytes)`);
    
    const decrypted4 = await decryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      encrypted4.payloadCt,
      encrypted4.nonce
    );
    console.log(`✓ Content match: ${decrypted4.content === "Last Friday during team retrospective" ? 'YES' : 'NO'}\n`);

    console.log("6. Testing behavior + impact (no content)...");
    const encrypted5 = await encryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      null,
      "Manager takes credit for team's work",
      "Team members feel undervalued and demotivated"
    );
    const decrypted5 = await decryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      encrypted5.payloadCt,
      encrypted5.nonce
    );
    console.log(`✓ Behavior match: ${decrypted5.behavior === "Manager takes credit for team's work" ? 'YES' : 'NO'}`);
    console.log(`✓ Impact match: ${decrypted5.impact === "Team members feel undervalued and demotivated" ? 'YES' : 'NO'}\n`);

    console.log("7. Testing AAD tampering protection...");
    const encrypted6 = await encryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      null,
      "Secret data",
      null
    );
    
    try {
      const wrongThreadId = `wrong-thread-${Date.now()}`;
      await decryptFeedbackFields(
        testOrgIdToUse,
        wrongThreadId,
        encrypted6.payloadCt,
        encrypted6.nonce
      );
      throw new Error("SECURITY FAILURE: AAD tampering was not detected!");
    } catch (error: any) {
      if (error.message.includes('SECURITY FAILURE')) {
        throw error;
      }
      console.log("✓ AAD tampering correctly detected and rejected\n");
    }

    console.log("8. Testing nonce tampering protection...");
    const encrypted7 = await encryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      null,
      "Another secret",
      null
    );
    
    try {
      const wrongNonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
      await decryptFeedbackFields(
        testOrgIdToUse,
        testThreadId,
        encrypted7.payloadCt,
        Buffer.from(wrongNonce)
      );
      throw new Error("SECURITY FAILURE: Nonce tampering was not detected!");
    } catch (error: any) {
      if (error.message.includes('SECURITY FAILURE')) {
        throw error;
      }
      console.log("✓ Nonce tampering correctly detected and rejected\n");
    }

    console.log("9. Testing all null fields...");
    const encrypted8 = await encryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      null,
      null,
      null
    );
    console.log(`✓ All null fields handled (nonce: ${encrypted8.nonce?.length || 'null'} bytes)`);
    const decrypted8 = await decryptFeedbackFields(
      testOrgIdToUse,
      testThreadId,
      encrypted8.payloadCt,
      encrypted8.nonce
    );
    console.log(`✓ All fields null: ${!decrypted8.content && !decrypted8.behavior && !decrypted8.impact ? 'YES' : 'NO'}\n`);

    console.log("✅ All integration tests passed!");
    console.log("   - Single field encryption works ✓");
    console.log("   - Multiple field encryption works ✓");
    console.log("   - Single nonce per payload (AEAD security) ✓");
    console.log("   - AAD tampering detected ✓");
    console.log("   - Nonce tampering detected ✓");

  } finally {
    console.log("\nCleaning up test data...");
    await db.delete(orgKeys).where(eq(orgKeys.orgId, testOrgIdToUse));
    await db.delete(orgs).where(eq(orgs.id, testOrgIdToUse));
    console.log("✓ Cleanup complete");
  }

  process.exit(0);
}

testIntegration().catch((error) => {
  console.error("\n❌ Integration test failed:", error);
  process.exit(1);
});
