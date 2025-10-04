import { cryptoReady, toBytes, aeadEnc, aeadDec, sha256Str } from "./encryption";
import { ensureOrgDEK, loadOrgDEK } from "./keys";
import sodium from "libsodium-wrappers";

export interface EncryptedFields {
  contentCt: Buffer | null;
  behaviorCt: Buffer | null;
  impactCt: Buffer | null;
  nonce: Buffer | null;
  aadHash: Buffer | null;
}

export async function encryptFeedbackFields(
  orgId: string,
  threadId: string,
  content: string | null,
  behavior: string | null,
  impact: string | null
): Promise<EncryptedFields> {
  if (!process.env.TM_MASTER_KEY_V1) {
    return {
      contentCt: null,
      behaviorCt: null,
      impactCt: null,
      nonce: null,
      aadHash: null,
    };
  }

  await cryptoReady();
  await ensureOrgDEK(orgId);
  const dek = await loadOrgDEK(orgId);

  const aadStr = `${orgId}|${threadId}`;
  const aad = toBytes(aadStr);
  
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

  let contentCt: Buffer | null = null;
  let behaviorCt: Buffer | null = null;
  let impactCt: Buffer | null = null;

  if (content !== null) {
    const result = aeadEnc(dek, toBytes(content), aad, nonce);
    contentCt = Buffer.from(result.ct);
  }

  if (behavior !== null) {
    const result = aeadEnc(dek, toBytes(behavior), aad, nonce);
    behaviorCt = Buffer.from(result.ct);
  }

  if (impact !== null) {
    const result = aeadEnc(dek, toBytes(impact), aad, nonce);
    impactCt = Buffer.from(result.ct);
  }

  const aadHash = Buffer.from(sha256Str(aadStr));

  return {
    contentCt,
    behaviorCt,
    impactCt,
    nonce: Buffer.from(nonce),
    aadHash,
  };
}

export async function decryptFeedbackFields(
  orgId: string,
  threadId: string,
  contentCt: Buffer | null,
  behaviorCt: Buffer | null,
  impactCt: Buffer | null,
  nonce: Buffer | null
): Promise<{
  content: string | null;
  behavior: string | null;
  impact: string | null;
}> {
  if (!process.env.TM_MASTER_KEY_V1 || !nonce) {
    return {
      content: null,
      behavior: null,
      impact: null,
    };
  }

  await cryptoReady();
  const dek = await loadOrgDEK(orgId);

  const aadStr = `${orgId}|${threadId}`;
  const aad = toBytes(aadStr);
  const nonceBytes = new Uint8Array(nonce);

  let content: string | null = null;
  let behavior: string | null = null;
  let impact: string | null = null;

  try {
    if (contentCt) {
      const decrypted = aeadDec(dek, new Uint8Array(contentCt), nonceBytes, aad);
      content = Buffer.from(decrypted).toString('utf8');
    }

    if (behaviorCt) {
      const decrypted = aeadDec(dek, new Uint8Array(behaviorCt), nonceBytes, aad);
      behavior = Buffer.from(decrypted).toString('utf8');
    }

    if (impactCt) {
      const decrypted = aeadDec(dek, new Uint8Array(impactCt), nonceBytes, aad);
      impact = Buffer.from(decrypted).toString('utf8');
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt feedback fields - data may be corrupted or tampered');
  }

  return { content, behavior, impact };
}
