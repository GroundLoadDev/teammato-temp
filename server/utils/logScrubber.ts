// Utility to scrub Slack identifiers from logs to preserve anonymity
// Redacts user_id, team_id, channel_id and related fields before logging

const SLACK_ID_FIELDS = [
  'user_id', 'team_id', 'channel_id', 
  'slackUserId', 'teamId', 'channelId',
  'bot_user_id', 'enterprise_id', 'authed_user',
  'trigger_id', 'response_url'
];

export function scrubSlackPayload(payload: any): any {
  if (typeof payload === 'string') {
    return '[SCRUBBED]';
  }
  
  if (Array.isArray(payload)) {
    return payload.map(scrubSlackPayload);
  }
  
  if (typeof payload === 'object' && payload !== null) {
    const scrubbed: any = {};
    for (const key in payload) {
      if (SLACK_ID_FIELDS.includes(key)) {
        scrubbed[key] = '[SCRUBBED]';
      } else if (key === 'user' || key === 'team' || key === 'channel') {
        // Scrub nested Slack objects
        scrubbed[key] = { id: '[SCRUBBED]' };
      } else {
        scrubbed[key] = payload[key];
      }
    }
    return scrubbed;
  }
  
  return payload;
}

// Helper for logging Slack events safely
export function logSlackEvent(eventType: string, context?: Record<string, any>) {
  const scrubbed = context ? scrubSlackPayload(context) : {};
  console.log(`[SLACK] ${eventType}`, scrubbed);
}
