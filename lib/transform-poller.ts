export interface PollerResult {
  ready: boolean;
  status: number;
  durationMs: number;
  attempts: number;
  error?: string;
}

export async function waitForTransformation(
  url: string,
  maxTimeoutMs = 25000,
  initialIntervalMs = 1500,
): Promise<PollerResult> {
  const startTime = Date.now();
  let attempts = 0;
  let currentInterval = initialIntervalMs;

  while (Date.now() - startTime < maxTimeoutMs) {
    attempts++;
    try {
      const response = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
      });

      if (response.status === 200) {
        return {
          ready: true,
          status: 200,
          durationMs: Date.now() - startTime,
          attempts,
        };
      }

      if (response.status === 423 || response.status === 202) {
        await new Promise((resolve) => setTimeout(resolve, currentInterval));
        currentInterval = Math.min(4000, currentInterval * 1.3);
        continue;
      }

      if (response.status >= 400 && response.status !== 423) {
        return {
          ready: false,
          status: response.status,
          durationMs: Date.now() - startTime,
          attempts,
          error: `Cloudinary returned error status ${response.status}`,
        };
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, currentInterval));
    }
  }

  return {
    ready: false,
    status: 408, // Request Timeout
    durationMs: Date.now() - startTime,
    attempts,
    error: `Transformation polling timed out after ${maxTimeoutMs}ms`,
  };
}
