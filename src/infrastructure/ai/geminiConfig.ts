/**
 * Centralized Gemini API Configuration
 * Supports currently active models and graceful fallback during traffic spikes.
 */
export const GEMINI_CONFIG = {
  /**
   * Primary model: Google Gemini's latest canonical lightweight Flash model.
   * High performance, low latency, and supported for generateContent.
   */
  primaryModel: "gemini-flash-lite-latest",

  /**
   * Resilient fallback model used if the primary model encounters temporary 503 (high demand).
   */
  fallbackModel: "gemini-3.5-flash-lite",

  /**
   * Maximum request timeout in milliseconds before AbortController aborts the network request.
   */
  timeoutMs: 25000,

  /**
   * Generation configuration tuning for structured event planning & creative assistance.
   */
  generationConfig: {
    maxOutputTokens: 3072,
    temperature: 0.7,
  },
} as const;
