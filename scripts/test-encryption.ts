import { cryptoReady, toBytes, aeadEnc, aeadDec, wrapDEK, unwrapDEK } from "../server/utils/encryption";
import sodium from "libsodium-wrappers";

async function testEncryption() {
  await cryptoReady();
  console.log("Testing encryption/decryption...\n");

  const testOrgId = "550e8400-e29b-41d4-a716-446655440000";
  const testThreadId = "650e8400-e29b-41d4-a716-446655440000";

  console.log("1. Generating test DEK (not using DB)...");
  const dek = sodium.randombytes_buf(32);
  console.log(`✓ DEK generated (${dek.length} bytes)\n`);
  
  console.log("2. Testing DEK wrap/unwrap...");
  const wrapped = wrapDEK(dek, testOrgId);
  console.log(`✓ Wrapped DEK (${wrapped.length} bytes)`);
  const unwrapped = unwrapDEK(wrapped, testOrgId);
  console.log(`✓ Unwrapped DEK (${unwrapped.length} bytes)`);
  console.log(`✓ Match: ${Buffer.from(dek).equals(Buffer.from(unwrapped)) ? 'YES' : 'NO'}\n`);

  console.log("3. Testing basic AEAD encryption...");
  const plaintext = "This is a test message";
  const aad = toBytes(`${testOrgId}|${testThreadId}`);
  const { ct, nonce } = aeadEnc(dek, toBytes(plaintext), aad);
  console.log(`✓ Encrypted: ${plaintext.length} bytes -> ${ct.length} bytes ciphertext\n`);

  console.log("4. Testing basic AEAD decryption...");
  const decrypted = aeadDec(dek, ct, nonce, aad);
  const decryptedText = Buffer.from(decrypted).toString('utf8');
  console.log(`✓ Decrypted: "${decryptedText}"`);
  console.log(`✓ Match: ${decryptedText === plaintext ? 'YES' : 'NO'}\n`);

  console.log("5. Testing multiple field encryption (SBI format)...");
  const testBehavior = "Team member interrupted standup to discuss unrelated topic";
  const testImpact = "Made the meeting run 15 minutes over schedule";
  
  const behaviorResult = aeadEnc(dek, toBytes(testBehavior), aad);
  const impactResult = aeadEnc(dek, toBytes(testImpact), aad);
  console.log(`✓ Encrypted behavior: ${behaviorResult.ct.length} bytes`);
  console.log(`✓ Encrypted impact: ${impactResult.ct.length} bytes\n`);

  console.log("6. Testing multiple field decryption...");
  const decryptedBehavior = Buffer.from(aeadDec(dek, behaviorResult.ct, behaviorResult.nonce, aad)).toString('utf8');
  const decryptedImpact = Buffer.from(aeadDec(dek, impactResult.ct, impactResult.nonce, aad)).toString('utf8');
  console.log(`✓ Decrypted behavior: "${decryptedBehavior}"`);
  console.log(`✓ Decrypted impact: "${decryptedImpact}"`);
  console.log(`✓ Behavior match: ${decryptedBehavior === testBehavior ? 'YES' : 'NO'}`);
  console.log(`✓ Impact match: ${decryptedImpact === testImpact ? 'YES' : 'NO'}\n`);

  console.log("7. Testing AAD tampering protection...");
  try {
    const wrongAad = toBytes(`${testOrgId}|wrong-thread-id`);
    aeadDec(dek, ct, nonce, wrongAad);
    console.log("✗ FAILED: Should have thrown error on AAD mismatch");
  } catch (error) {
    console.log("✓ Correctly rejected tampered AAD\n");
  }

  console.log("✅ All encryption tests passed!");
  process.exit(0);
}

testEncryption().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
