import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { GoogleGenerativeAI } from "@google/generative-ai";

vi.mock("@google/generative-ai");

describe("/api/ai/health route", () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "AIzaSyTestKey12345";
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  const dummyReq = () => new Request("http://localhost/api/ai/health");

  it("returns 503 if GEMINI_API_KEY is not configured", async () => {
    process.env.GEMINI_API_KEY = "";
    const res = await GET(dummyReq());
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.apiKeyConfigured).toBe(false);
  });

  it("returns 200 and model results when Gemini succeeds via POST", async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: {
        text: () => "OK",
      },
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation(
      () =>
        ({
          getGenerativeModel: () => ({
            generateContent: mockGenerateContent,
          }),
        }) as unknown as GoogleGenerativeAI
    );

    const res = await POST(dummyReq());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.keyMeta.configured).toBe(true);
    expect(json.keyMeta.startsWithAIza).toBe(true);
    expect(json.response).toBe("OK");
  });

  it("returns 502 when model call fails via GET", async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue({
      name: "GoogleGenerativeAIFetchError",
      status: 404,
      statusText: "Not Found",
      message: "Model not found",
    });

    vi.mocked(GoogleGenerativeAI).mockImplementation(
      () =>
        ({
          getGenerativeModel: () => ({
            generateContent: mockGenerateContent,
          }),
        }) as unknown as GoogleGenerativeAI
    );

    const res = await GET(dummyReq());
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.status).toBe(404);
  });

  it("handles generic error without status or statusText gracefully", async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue(new Error("Generic socket hangup"));

    vi.mocked(GoogleGenerativeAI).mockImplementation(
      () =>
        ({
          getGenerativeModel: () => ({
            generateContent: mockGenerateContent,
          }),
        }) as unknown as GoogleGenerativeAI
    );

    const res = await GET(dummyReq());
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.status).toBe(500);
    expect(json.error.message).toBe("Generic socket hangup");
  });

  it("handles primitive non-object errors gracefully", async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue("raw string exception");

    vi.mocked(GoogleGenerativeAI).mockImplementation(
      () =>
        ({
          getGenerativeModel: () => ({
            generateContent: mockGenerateContent,
          }),
        }) as unknown as GoogleGenerativeAI
    );

    const res = await GET(dummyReq());
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.status).toBe(500);
    expect(json.error.message).toBe("Unknown error");
    expect(json.error.name).toBe("Error");
  });

  it("enforces rate limits when request is provided to GET/POST", async () => {
    const { globalApiRateLimiter } = await import("@/infrastructure/security/RateLimiter");
    globalApiRateLimiter.reset();
    const req = new Request("http://localhost/api/ai/health", {
      method: "GET",
      headers: { "x-real-ip": "1.2.3.4" },
    });
    for (let i = 0; i < 30; i++) {
      globalApiRateLimiter.check("1.2.3.4");
    }
    const blockedGet = await GET(req);
    expect(blockedGet.status).toBe(429);

    const postReq = new Request("http://localhost/api/ai/health", {
      method: "POST",
      headers: { "x-real-ip": "1.2.3.4" },
    });
    const blockedPost = await POST(postReq);
    expect(blockedPost.status).toBe(429);
  });
});


