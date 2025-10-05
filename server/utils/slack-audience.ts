/**
 * Slack Audience Helpers
 * 
 * Fetch eligible members for seat cap calculation based on audience mode:
 * - Workspace: all active human members
 * - User group: members of a specific Slack user group
 * - Channels: unique members across selected channels
 * 
 * All modes exclude deleted users and bots.
 * Optionally exclude guests (is_restricted, is_ultra_restricted).
 */

import { WebClient } from "@slack/web-api";

/**
 * List all active human members in the workspace
 * Excludes: deleted users, bots, and optionally guests
 */
export async function listWorkspaceMembers(
  client: WebClient,
  excludeGuests: boolean
): Promise<string[]> {
  const members: any[] = [];
  let cursor: string | undefined;

  do {
    const resp = await client.users.list({ limit: 200, cursor });
    members.push(...(resp.members ?? []));
    cursor = (resp.response_metadata?.next_cursor || "") || undefined;
  } while (cursor);

  return members
    .filter((u) => {
      if (u.deleted) return false;
      if (u.is_bot) return false;
      if (excludeGuests && (u.is_restricted || u.is_ultra_restricted)) return false;
      return true;
    })
    .map((u) => u.id);
}

/**
 * List members of a Slack user group
 * Note: Does not filter out guests/bots automatically - the user group should be curated
 * For extra safety, you can optionally fetch profiles and filter
 */
export async function listUserGroupMembers(
  client: WebClient,
  usergroupId: string
): Promise<string[]> {
  const resp = await client.usergroups.users.list({ usergroup: usergroupId });
  return resp.users ?? [];
}

/**
 * Get unique members across multiple channels
 * Excludes: deleted users, bots, and optionally guests
 */
export async function uniqueMembersFromChannels(
  client: WebClient,
  channelIds: string[],
  excludeGuests: boolean
): Promise<string[]> {
  const set = new Set<string>();

  // Collect all member IDs across channels
  for (const id of channelIds) {
    let cursor: string | undefined;
    do {
      const resp = await client.conversations.members({
        channel: id,
        limit: 1000,
        cursor,
      });
      (resp.members ?? []).forEach((m) => set.add(m));
      cursor = (resp.response_metadata?.next_cursor || "") || undefined;
    } while (cursor);
  }

  // If not excluding guests, return early
  if (!excludeGuests) {
    return Array.from(set);
  }

  // Filter out deleted/bot/guest users by fetching profiles
  const ids = Array.from(set);
  const filtered = new Set<string>();

  // Note: users.info is rate-limited (1 call per user)
  // For large audiences, consider batching or caching
  for (const user of ids) {
    try {
      const info = await client.users.info({ user });
      const u = (info.user as any) || {};
      if (u.deleted || u.is_bot) continue;
      if (u.is_restricted || u.is_ultra_restricted) continue;
      filtered.add(user);
    } catch (error) {
      // Skip users we can't fetch (may be deleted/deactivated)
      console.warn(`Failed to fetch user ${user}:`, error);
    }
  }

  return Array.from(filtered);
}
