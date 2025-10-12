/**
 * Centralized logging utility with sensitive information filtering
 *
 * Features:
 * - Filters sensitive data (User IDs, emails, Supabase error internals)
 * - Environment-aware (detailed logs in dev, filtered in production)
 * - Prepares for Sentry integration
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isClient = typeof window !== 'undefined';

interface LoggerOptions {
  context: string;
  error?: any;
  metadata?: Record<string, any>;
  userId?: string;
}

/**
 * Masks UUID to prevent user tracking
 * Example: "550e8400-e29b-41d4-a716-446655440000" → "uuid-****"
 */
function maskUUID(uuid: string): string {
  if (!uuid || typeof uuid !== 'string') return 'uuid-****';
  return `uuid-${uuid.slice(-4)}`;
}

/**
 * Masks email addresses
 * Example: "test@example.com" → "t***@e***.com"
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '***@***.***';
  const [local, domain] = email.split('@');
  if (!domain) return '***';

  const maskedLocal = local.charAt(0) + '***';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts.length > 1
    ? `${domainParts[0].charAt(0)}***.${domainParts[domainParts.length - 1]}`
    : 'd***';

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Sanitizes Supabase error objects by removing sensitive fields
 * Removes: code, details, hint, schema, table, constraint
 * Keeps: message (user-friendly)
 */
function sanitizeSupabaseError(error: any): any {
  if (!error) return null;

  // If it's a Supabase error object
  if (typeof error === 'object') {
    const sanitized: any = {};

    // Keep safe fields
    if (error.message && typeof error.message === 'string') {
      // Remove potentially sensitive patterns from message
      sanitized.message = error.message
        .replace(/relation ".*?" /g, 'table ')
        .replace(/constraint ".*?"/g, 'constraint')
        .replace(/Key \(.*?\)/g, 'Key');
    }

    // Keep error name if it exists
    if (error.name) {
      sanitized.name = error.name;
    }

    // Keep status code (not sensitive)
    if (error.status || error.statusCode) {
      sanitized.status = error.status || error.statusCode;
    }

    // In development, add a note about filtered fields
    if (isDevelopment) {
      sanitized._note = 'Sensitive fields filtered (code, details, hint, schema, table)';
    }

    return sanitized;
  }

  return String(error);
}

/**
 * Recursively sanitizes an object by masking sensitive fields
 */
function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 3) return '[Max depth reached]'; // Prevent infinite recursion
  if (!obj) return obj;

  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  const sanitized: any = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'access_token', 'refresh_token'];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Remove sensitive keys entirely
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Mask user IDs
    if ((lowerKey.includes('user_id') || lowerKey.includes('userid') || key === 'id') &&
        typeof value === 'string' &&
        value.length > 20) {
      sanitized[key] = maskUUID(value);
      continue;
    }

    // Mask emails
    if ((lowerKey.includes('email') || lowerKey === 'mail') &&
        typeof value === 'string' &&
        value.includes('@')) {
      sanitized[key] = maskEmail(value);
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Formats log message with context
 */
function formatLogMessage(options: LoggerOptions): string {
  const { context, metadata } = options;
  const parts = [`[${context}]`];

  if (metadata) {
    const sanitizedMetadata = sanitizeObject(metadata);
    parts.push(JSON.stringify(sanitizedMetadata));
  }

  return parts.join(' ');
}

/**
 * Logger class with filtered output
 */
class Logger {
  /**
   * Log error messages (always logged in production)
   */
  error(options: LoggerOptions): void {
    const { context, error, metadata, userId } = options;

    const sanitizedError = sanitizeSupabaseError(error);
    const sanitizedMetadata = metadata ? sanitizeObject(metadata) : {};

    if (userId) {
      sanitizedMetadata.userId = maskUUID(userId);
    }

    if (isDevelopment) {
      // Development: Show more details
      console.error(`❌ [${context}]`, sanitizedError, sanitizedMetadata);

      // Also show original error in a collapsed group for debugging
      if (error) {
        console.groupCollapsed(`🔍 Original error (dev only)`);
        console.error(error);
        console.groupEnd();
      }
    } else {
      // Production: Filtered output only
      console.error(`❌ [${context}]`, sanitizedError?.message || 'An error occurred');

      // TODO: Send to Sentry or other logging service
      // if (window.Sentry) {
      //   window.Sentry.captureException(sanitizedError, {
      //     contexts: {
      //       custom: {
      //         context,
      //         ...sanitizedMetadata
      //       }
      //     }
      //   });
      // }
    }
  }

  /**
   * Log warning messages
   */
  warn(options: LoggerOptions): void {
    const { context, metadata } = options;
    const message = formatLogMessage(options);

    if (isDevelopment) {
      console.warn(`⚠️ ${message}`);
    } else {
      console.warn(`⚠️ [${context}]`);
    }
  }

  /**
   * Log info messages (selective in production)
   */
  info(options: LoggerOptions): void {
    const { context, metadata, userId } = options;

    const sanitizedMetadata = metadata ? sanitizeObject(metadata) : {};
    if (userId) {
      sanitizedMetadata.userId = maskUUID(userId);
    }

    if (isDevelopment) {
      console.log(`ℹ️ [${context}]`, sanitizedMetadata);
    }
    // Production: Only log critical info (can be controlled with a flag)
  }

  /**
   * Log debug messages (development only)
   */
  debug(options: LoggerOptions): void {
    if (!isDevelopment) return;

    const { context, metadata } = options;
    const message = formatLogMessage(options);

    console.log(`🔍 ${message}`);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export utility functions for testing
export { maskUUID, maskEmail, sanitizeSupabaseError };