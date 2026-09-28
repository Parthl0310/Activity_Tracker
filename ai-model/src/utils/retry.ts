// Retry utility for rate limits
// Ref: AI-MODEL-README.md § 7 Rate Limits & Backoff

export async function withBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      const message = error?.message || '';
      
      // If daily quota is exhausted, fail fast to allow fallback without blocking UI
      if (message.includes('PerDay') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
        throw error;
      }

      // Retry on 429 Too Many Requests, 503 Service Unavailable, timeouts, or network resets
      const isRetryable =
        status === 429 ||
        status === 503 ||
        status === 504 ||
        message.includes('timed out') ||
        message.includes('timeout') ||
        message.includes('ECONNRESET') ||
        message.includes('ETIMEDOUT') ||
        message.includes('fetch failed');

      if (!isRetryable) {
        throw error;
      }

      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }

      // Exponential backoff: 2^attempt * 1000 ms
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
