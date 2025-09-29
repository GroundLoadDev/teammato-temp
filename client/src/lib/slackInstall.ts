import { appEnv } from './appEnv';

// Unified Slack authorize URL builder
export function buildSlackAuthorizeUrl(scopes: string[] = []): string {
  const defaultScopes = [
    'commands',
    'chat:write',
    'users:read',
    'users:read.email',
    'team:read'
  ];
  
  const scopeList = scopes.length > 0 ? scopes : defaultScopes;
  
  const params = new URLSearchParams({
    client_id: appEnv.slackClientId,
    scope: scopeList.join(','),
    redirect_uri: appEnv.slackRedirectUri,
  });
  
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}
