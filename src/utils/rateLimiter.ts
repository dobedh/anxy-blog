/**
 * Client-side Rate Limiter using localStorage
 *
 * 정상 사용자는 절대 걸리지 않는 관대한 설정:
 * - Login: 10 attempts / 15 minutes
 * - Signup: 3 attempts / 1 hour
 * - OAuth: 5 attempts / 5 minutes
 *
 * 주의: localStorage 기반이므로 기술적으로 우회 가능
 * 악의적 사용자 차단보다는 일반 사용자 보호 목적
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until next attempt
  remaining?: number; // remaining attempts
}

interface RateLimitRecord {
  attempts: number[];
  blockedUntil?: number;
}

/**
 * Check rate limit for a given key
 * @param key Unique identifier (e.g., 'login:email' or 'signup:ip')
 * @param limit Maximum attempts allowed
 * @param windowMs Time window in milliseconds
 * @returns Rate limit result with allowed status and retry time
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  // Client-side only
  if (typeof window === 'undefined') {
    return { allowed: true };
  }

  const now = Date.now();
  const storageKey = `rateLimit:${key}`;

  try {
    // Get existing record
    const recordStr = localStorage.getItem(storageKey);
    const record: RateLimitRecord = recordStr
      ? JSON.parse(recordStr)
      : { attempts: [] };

    // Check if currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
      };
    }

    // Remove attempts outside the time window
    const windowStart = now - windowMs;
    record.attempts = record.attempts.filter(
      (timestamp) => timestamp > windowStart
    );

    // Check if limit exceeded
    if (record.attempts.length >= limit) {
      // Block for the remaining window time
      const oldestAttempt = Math.min(...record.attempts);
      const blockedUntil = oldestAttempt + windowMs;
      record.blockedUntil = blockedUntil;

      localStorage.setItem(storageKey, JSON.stringify(record));

      const retryAfter = Math.ceil((blockedUntil - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
      };
    }

    // Allow attempt and record it
    record.attempts.push(now);
    delete record.blockedUntil;

    localStorage.setItem(storageKey, JSON.stringify(record));

    return {
      allowed: true,
      remaining: limit - record.attempts.length,
    };
  } catch (error) {
    // If localStorage fails, allow the request (graceful degradation)
    console.error('Rate limiter error:', error);
    return { allowed: true };
  }
}

/**
 * Reset rate limit for a key (useful after successful operation)
 */
export function resetRateLimit(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    const storageKey = `rateLimit:${key}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Rate limiter reset error:', error);
  }
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  if (typeof window === 'undefined') {
    return { allowed: true };
  }

  const now = Date.now();
  const storageKey = `rateLimit:${key}`;

  try {
    const recordStr = localStorage.getItem(storageKey);
    if (!recordStr) {
      return { allowed: true, remaining: limit };
    }

    const record: RateLimitRecord = JSON.parse(recordStr);

    // Check if blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
      return { allowed: false, retryAfter, remaining: 0 };
    }

    // Count attempts in window
    const windowStart = now - windowMs;
    const validAttempts = record.attempts.filter(
      (timestamp) => timestamp > windowStart
    );

    if (validAttempts.length >= limit) {
      const oldestAttempt = Math.min(...validAttempts);
      const retryAfter = Math.ceil((oldestAttempt + windowMs - now) / 1000);
      return { allowed: false, retryAfter, remaining: 0 };
    }

    return {
      allowed: true,
      remaining: limit - validAttempts.length,
    };
  } catch (error) {
    console.error('Rate limiter status error:', error);
    return { allowed: true };
  }
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  LOGIN: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts / 15 minutes
  SIGNUP: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts / 1 hour
  OAUTH: { limit: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts / 5 minutes
  USERNAME_CHECK: { limit: 30, windowMs: 5 * 60 * 1000 }, // 30 attempts / 5 minutes
} as const;