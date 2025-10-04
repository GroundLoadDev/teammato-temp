import sodium from "libsodium-wrappers";

export type Bytes = Uint8Array;

let ready = false;
export async function cryptoReady() {
  if (!ready) { 
    await sodium.ready; 
    ready = true; 
  }
}

const MK_B64 = process.env.TM_MASTER_KEY_V1;
if (!MK_B64) {
  console.warn("TM_MASTER_KEY_V1 not set - encryption will not work");
}

const getMK = () => {
  if (!MK_B64) throw new Error("Missing TM_MASTER_KEY_V1");
  return sodium.from_base64(MK_B64, sodium.base64_variants.ORIGINAL);
};

export const toBytes   = (s: string) => sodium.from_string(s);
export const toString  = (b: Bytes)  => sodium.to_string(b);
export const b64Encode = (b: Bytes)  => sodium.to_base64(b, sodium.base64_variants.ORIGINAL);
export const b64Decode = (s: string) => sodium.from_base64(s, sodium.base64_variants.ORIGINAL);

export function aeadEnc(key: Bytes, plaintext: Bytes, aad: Bytes, nonce?: Bytes) {
  const nonceToUse = nonce || sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, aad, null, nonceToUse, key);
  return { ct, nonce: nonceToUse };
}

export function aeadDec(key: Bytes, ct: Bytes, nonce: Bytes, aad: Bytes) {
  return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct, aad, nonce, key);
}

export function sha256Str(s: string) {
  return sodium.crypto_generichash(32, toBytes(s));
}

export function wrapDEK(dek: Bytes, orgId: string) {
  const aad   = toBytes(orgId);
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const body  = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(dek, aad, null, nonce, getMK());
  const out = new Uint8Array(nonce.length + body.length);
  out.set(nonce, 0); 
  out.set(body, nonce.length);
  return out;
}

export function unwrapDEK(wrapped: Bytes, orgId: string) {
  const nonceLen = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
  const nonce = wrapped.slice(0, nonceLen);
  const body  = wrapped.slice(nonceLen);
  const aad   = toBytes(orgId);
  return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, body, aad, nonce, getMK());
}
