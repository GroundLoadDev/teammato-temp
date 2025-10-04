import sodium from "libsodium-wrappers";
import { cryptoReady, wrapDEK, unwrapDEK } from "./encryption";
import { db } from "../db";
import { orgKeys } from "../../shared/schema";
import { eq } from "drizzle-orm";

type Bytes = Uint8Array;

type CacheEntry = { dek: Uint8Array; exp: number };
const cache = new Map<string, CacheEntry>();
const TTL = Number(process.env.TM_DEK_CACHE_TTL_MS || 20 * 60 * 1000);

function cacheGet(orgId: string) {
  const hit = cache.get(orgId);
  if (hit && hit.exp > Date.now()) return hit.dek;
  if (hit) cache.delete(orgId);
  return null;
}

function cachePut(orgId: string, dek: Uint8Array) {
  cache.set(orgId, { dek, exp: Date.now() + TTL });
}

export async function ensureOrgDEK(orgId: string) {
  await cryptoReady();
  
  const existing = await db.query.orgKeys.findFirst({
    where: eq(orgKeys.orgId, orgId)
  });
  
  if (existing) return;
  
  const dek = sodium.randombytes_buf(32);
  const wrapped = wrapDEK(dek, orgId);
  
  await db.insert(orgKeys).values({
    orgId,
    wrappedDek: Buffer.from(wrapped)
  });
  
  cachePut(orgId, dek);
}

export async function loadOrgDEK(orgId: string): Promise<Uint8Array> {
  await cryptoReady();
  
  const cached = cacheGet(orgId);
  if (cached) return cached;
  
  const row = await db.query.orgKeys.findFirst({
    where: eq(orgKeys.orgId, orgId)
  });
  
  if (!row) {
    throw new Error(`org_keys missing for ${orgId}`);
  }
  
  const wrapped: Buffer = row.wrappedDek as Buffer;
  const dek = unwrapDEK(new Uint8Array(wrapped), orgId);
  cachePut(orgId, dek);
  return dek;
}

export async function rewrapOrgDEK(orgId: string) {
  await cryptoReady();
  const MK2 = process.env.TM_MASTER_KEY_V2;
  if (!MK2) throw new Error("TM_MASTER_KEY_V2 not set");
  
  const row = await db.query.orgKeys.findFirst({
    where: eq(orgKeys.orgId, orgId)
  });
  
  if (!row) throw new Error("org not found");
  
  const wrapped: Buffer = row.wrappedDek as Buffer;
  
  const bak = process.env.TM_MASTER_KEY_V1!;
  (process.env as any).TM_MASTER_KEY_V1 = MK2;
  const dek = unwrapDEK(new Uint8Array(wrapped), orgId);
  const newWrapped = wrapDEK(dek, orgId);
  (process.env as any).TM_MASTER_KEY_V1 = bak;
  
  await db.update(orgKeys)
    .set({ 
      wrappedDek: Buffer.from(newWrapped),
      rotatedAt: new Date()
    })
    .where(eq(orgKeys.orgId, orgId));
  
  cache.delete(orgId);
  return true;
}
