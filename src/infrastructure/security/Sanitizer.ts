export class Sanitizer {
  private static readonly HTML_TAG_REGEX = /<[^>]*>?/gm;
  private static readonly SCRIPT_REGEX = /(?:javascript|vbscript|data):/gi;
  private static readonly CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

  /**
   * Sanitizes generic string inputs by stripping HTML tags, script schemes,
   * non-printable control characters, null bytes, trimming whitespace,
   * and enforcing maximum length.
   */
  public static sanitizeString(input: unknown, maxLength: number = 2000): string {
    if (typeof input !== "string") {
      return "";
    }

    const stripped = input
      .normalize("NFKC")
      .replace(this.CONTROL_CHARS_REGEX, "")
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
