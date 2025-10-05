/**
 * Audience Service
 * 
 * Recompute eligible count for seat cap enforcement based on org's audience mode
 */

import { WebClient } from "@slack/web-api";
import {
  listWorkspaceMembers,
  listUserGroupMembers,
  uniqueMembersFromChannels,
} from "../utils/slack-audience";
import type { OrgAudience } from "@shared/schema";

/**
 * Recompute the eligible count for an organization
 * Returns the number of eligible members based on audience configuration
 */
export async function recomputeEligibleCount(
  botToken: string,
  audience: OrgAudience
): Promise<number> {
  const client = new WebClient(botToken);
  let ids: string[] = [];

  if (audience.mode === "workspace") {
    ids = await listWorkspaceMembers(client, audience.excludeGuests);
  } else if (audience.mode === "user_group" && audience.usergroupId) {
    ids = await listUserGroupMembers(client, audience.usergroupId);
    // Note: User groups should be curated by admins
    // We don't filter guests here as the group membership is intentional
  } else if (audience.mode === "channels" && audience.channelIds && audience.channelIds.length > 0) {
    ids = await uniqueMembersFromChannels(client, audience.channelIds, audience.excludeGuests);
  }

  return ids.length;
}
