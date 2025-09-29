// Environment helper to safely read environment values
export const appEnv = {
  // Public environment variables (accessible on frontend)
  appEnv: import.meta.env.VITE_PUBLIC_APP_ENV || 'production',
  slackClientId: import.meta.env.VITE_PUBLIC_SLACK_CLIENT_ID || import.meta.env.VITE_PUBLIC_SLACK_CLIENT_ID_TEST || '',
  slackRedirectUri: import.meta.env.VITE_PUBLIC_SLACK_REDIRECT_URI || import.meta.env.VITE_PUBLIC_SLACK_REDIRECT_URI_TEST || '',
  
  isTest: () => {
    return (import.meta.env.VITE_PUBLIC_APP_ENV || '').toLowerCase() === 'test';
  },
  
  isProduction: () => {
    return (import.meta.env.VITE_PUBLIC_APP_ENV || 'production').toLowerCase() === 'production';
  }
};
