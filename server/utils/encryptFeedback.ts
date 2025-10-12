import { cryptoReady, toBytes, aeadEnc, aeadDec, sha256Str } from "./encryption";
import { ensureOrgDEK, loadOrgDEK } from "./keys";
import { logEncryptionEvent } from "./encryptionMonitor";
import sodium from "libsodium-wrappers";

export interface EncryptedFields {
  payloadCt: Buffer | null;
  nonce: Buffer | null;
  aadHash: Buffer | null;
}

interface FeedbackPayload {
  content: string | null;
  behavior: string | null;
  impact: string | null;
}

export async function encryptFeedbackFields(
  orgId: string,
  threadId: string,
  content: string | null,
  behavior: string | null,
  impact: string | null
): Promise<EncryptedFields> {
  if (!process.env.TM_MASTER_KEY_V1) {
    logEncryptionEvent({
      type: 'KEY_MISSING',
      orgId,
      threadId,
      error: 'TM_MASTER_KEY_V1 environment variable not configured'
    });
    throw new Error('ENCRYPTION_KEY_MISSING: TM_MASTER_KEY_V1 environment variable must be configured');
  }

  try {
    await cryptoReady();
    await ensureOrgDEK(orgId);
    const dek = await loadOrgDEK(orgId);

    const aadStr = `${orgId}|${threadId}`;
    const aad = toBytes(aadStr);
    
    // Pack all fields into single payload - encrypt once with one nonce
    const payload: FeedbackPayload = {
      content,
      behavior,
      impact
    };
    
    const payloadJson = JSON.stringify(payload);
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    
    const result = aeadEnc(dek, toBytes(payloadJson), aad, nonce);
    const aadHash = Buffer.from(sha256Str(aadStr));

    logEncryptionEvent({
      type: 'ENCRYPTION_SUCCESS',
      orgId,
      threadId
    });

    return {
      payloadCt: Buffer.from(result.ct),
      nonce: Buffer.from(nonce),
      aadHash,
    };
  } catch (error) {
    logEncryptionEvent({
      type: 'ENCRYPTION_FAILED',
      orgId,
      threadId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`ENCRYPTION_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function decryptFeedbackFields(
  orgId: string,
  threadId: string,
  payloadCt: Buffer | null,
  nonce: Buffer | null
): Promise<{
  content: string | null;
  behavior: string | null;
  impact: string | null;
}> {
  // Handle missing encryption data gracefully (legacy/unencrypted rows)
  if (!process.env.TM_MASTER_KEY_V1 || !nonce || !payloadCt) {
    if (!process.env.TM_MASTER_KEY_V1) {
      logEncryptionEvent({
        type: 'KEY_MISSING',
        orgId,
        threadId,
        error: 'TM_MASTER_KEY_V1 not configured for decryption'
      });
    }
    return {
      content: null,
      behavior: null,
      impact: null,
    };
  }

  try {
    await cryptoReady();
    const dek = await loadOrgDEK(orgId);

    const aadStr = `${orgId}|${threadId}`;
    const aad = toBytes(aadStr);
    const nonceBytes = new Uint8Array(nonce);

    const decrypted = aeadDec(dek, new Uint8Array(payloadCt), nonceBytes, aad);
    const payloadJson = Buffer.from(decrypted).toString('utf8');
    const payload: FeedbackPayload = JSON.parse(payloadJson);
    
    logEncryptionEvent({
      type: 'DECRYPTION_SUCCESS',
      orgId,
      threadId
    });

    return {
      content: payload.content,
      behavior: payload.behavior,
      impact: payload.impact
    };
  } catch (error) {
    logEncryptionEvent({
      type: 'DECRYPTION_FAILED',
      orgId,
      threadId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Return nulls instead of throwing for legacy compatibility
    return {
      content: null,
      behavior: null,
      impact: null,
    };
  }
}
