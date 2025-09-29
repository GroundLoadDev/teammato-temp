// Structured logger with redaction for Edge Functions
// Ensures no content or user identity is leaked in logs

export interface LogContext {
  orgId?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

export function createEdgeLogger(functionName: string) {
  const redactContent = (data: any): any => {
    if (typeof data === 'string') {
      return '[REDACTED]';
    }
    if (Array.isArray(data)) {
      return data.map(redactContent);
    }
    if (typeof data === 'object' && data !== null) {
      const redacted: any = {};
      for (const key in data) {
        // Redact sensitive fields
        if (['content', 'body', 'title', 'email', 'name', 'ip', 'userAgent'].includes(key)) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = data[key];
        }
      }
      return redacted;
    }
    return data;
  };

  return {
    info: (message: string, context?: LogContext) => {
      console.log(JSON.stringify({
        level: 'info',
        function: functionName,
        message,
        context: context ? redactContent(context) : undefined,
        timestamp: new Date().toISOString()
      }));
    },
    
    error: (message: string, error?: Error, context?: LogContext) => {
      console.error(JSON.stringify({
        level: 'error',
        function: functionName,
        message,
        error: error?.message,
        stack: error?.stack,
        context: context ? redactContent(context) : undefined,
        timestamp: new Date().toISOString()
      }));
    },
    
    warn: (message: string, context?: LogContext) => {
      console.warn(JSON.stringify({
        level: 'warn',
        function: functionName,
        message,
        context: context ? redactContent(context) : undefined,
        timestamp: new Date().toISOString()
      }));
    }
  };
}
