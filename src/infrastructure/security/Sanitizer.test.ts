import { describe, expect, it } from "vitest";
import { Sanitizer } from "./Sanitizer";

describe("Sanitizer", () => {
  it("strips HTML tags and script protocols", () => {
    const raw = `<script>alert('xss')</script>Hello <b onmouseover="evil()">World</b> javascript:void(0) vbscript:execute data:text/html\0\x08`;
    const sanitized = Sanitizer.sanitizeString(raw);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("<b>");
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain("vbscript:");
    expect(sanitized).not.toContain("data:");
    expect(sanitized).not.toContain("\0");
    expect(sanitized).toContain("Hello World");
  });

  it("handles non-string inputs safely", () => {
    expect(Sanitizer.sanitizeString(null)).toBe("");
    expect(Sanitizer.sanitizeString(undefined)).toBe("");
    expect(Sanitizer.sanitizeString(12345)).toBe("");
  });

  it("enforces maximum length truncation", () => {
    const longString = "A".repeat(50);
    const sanitized = Sanitizer.sanitizeString(longString, 20);
    expect(sanitized.length).toBe(20);
  });

  it("sanitizes non-negative numbers accurately", () => {
    expect(Sanitizer.sanitizeNonNegativeNumber(150)).toBe(150);
    expect(Sanitizer.sanitizeNonNegativeNumber("250")).toBe(250);
    expect(Sanitizer.sanitizeNonNegativeNumber(-50, 1000, 10)).toBe(10);
    expect(Sanitizer.sanitizeNonNegativeNumber("invalid", 1000, 5)).toBe(5);
    expect(Sanitizer.sanitizeNonNegativeNumber(5000, 1000, 0)).toBe(1000);
  });

  it("extracts clean JSON from raw text and markdown fences", () => {
    const rawMarkdown = "```json\n{\n  \"key\": \"value\"\n}\n```";
    expect(Sanitizer.extractJsonText(rawMarkdown)).toBe('{\n  "key": "value"\n}');

    const markdownWithoutJsonTag = "```\n[1, 2, 3]\n```";
    expect(Sanitizer.extractJsonText(markdownWithoutJsonTag)).toBe("[1, 2, 3]");

    const plainJson = '{"pure": true}';
    expect(Sanitizer.extractJsonText(plainJson)).toBe('{"pure": true}');
  });
});
