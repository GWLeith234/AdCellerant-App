import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

/**
 * Call Anthropic messages.create with retry logic and 30s timeout.
 * Retries up to maxAttempts on 500+ errors and network failures.
 * Does NOT retry on 400/401/403 (config errors).
 */
export async function createMessageWithRetry(
  params: Anthropic.MessageCreateParams,
  maxAttempts = 3
): Promise<Anthropic.Message> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const message = await client.messages.create(params, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return message;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err as Error;

      // Don't retry on client errors (400/401/403)
      if (err instanceof Anthropic.APIError && err.status < 500) {
        throw err;
      }

      console.error(
        `AI attempt ${attempt}/${maxAttempts} failed:`,
        err instanceof Anthropic.APIError ? `status ${err.status}` : (err as Error).message
      );

      // Exponential backoff: 500ms, 1000ms, 2000ms
      if (attempt < maxAttempts) {
        await new Promise((r) =>
          setTimeout(r, 500 * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  throw lastError!;
}
