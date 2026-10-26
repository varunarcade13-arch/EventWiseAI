export class Sanitizer {
  private static readonly HTML_TAG_REGEX = /<[^>]*>?/gm;
  private static readonly SCRIPT_REGEX = /javascript:/gi;

  /**
   * Sanitizes generic string inputs by stripping HTML tags, script schemes,
   * trimming whitespace, and enforcing maximum length.
   */
  public static sanitizeString(input: unknown, maxLength: number = 2000): string {
    if (typeof input !== "string") {
      return "";
    }

    const stripped = input
      .replace(this.HTML_TAG_REGEX, "")
      .replace(this.SCRIPT_REGEX, "")
      .trim();

    return stripped.slice(0, maxLength);
  }

  /**
   * Sanitizes a number, guaranteeing it is a finite non-negative number within bounds.
   */
  public static sanitizeNonNegativeNumber(
    input: unknown,
    max: number = 1_000_000_000,
    defaultValue: number = 0
  ): number {
    const num = Number(input);
    if (!Number.isFinite(num) || num < 0) {
      return defaultValue;
    }
    return Math.min(num, max);
  }

  /**
   * Cleans AI-returned JSON text by stripping markdown backticks if present.
   */
  public static extractJsonText(raw: string): string {
    const trimmed = raw.trim();
    const markdownMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1].trim();
    }
    return trimmed;
  }
}
