/**
 * analyzeService.test.ts
 * Unit tests for the URL analysis service.
 * Axios is mocked so tests run fast and offline.
 *
 * Coverage:
 *   ✓ Successful HTML page analysis
 *   ✓ Invalid URL (no network call made)
 *   ✓ Timeout / connection aborted
 *   ✓ Non-HTML content type
 *   ✓ DNS failure
 */

import { analyzePage, validateUrl, AnalyzeServiceError } from "../services/analyzeService";
import axios from "axios";

// Mock the entire axios module so no real HTTP calls are made
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Provide a concrete implementation of isAxiosError that matches axios's own logic:
// it checks for the `isAxiosError: true` property on the error object.
// Without this, the jest auto-mock returns undefined and the service falls through
// to the generic FETCH_ERROR path.
(axios.isAxiosError as jest.Mock).mockImplementation(
  (val: unknown): boolean =>
    val !== null &&
    typeof val === "object" &&
    (val as Record<string, unknown>).isAxiosError === true,
);

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a fake axios response */
function makeHtmlResponse(
  html: string,
  status = 200,
  contentType = "text/html; charset=utf-8",
) {
  return {
    status,
    headers: { "content-type": contentType },
    data: html,
  };
}

/** A realistic HTML page for testing */
const SAMPLE_HTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Example Domain</title>
    <meta name="description" content="This domain is for use in illustrative examples." />
  </head>
  <body>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents.</p>
    <img src="logo.png" />
    <img src="hero.jpg" alt="Hero image" />
    <a href="https://www.iana.org/domains/example">More information...</a>
  </body>
</html>
`;

// ── Test suites ────────────────────────────────────────────────────────────────

describe("validateUrl()", () => {
  it("passes for a valid https URL", () => {
    expect(() => validateUrl("https://example.com")).not.toThrow();
  });

  it("passes for a valid http URL", () => {
    expect(() => validateUrl("http://example.com/path?q=1")).not.toThrow();
  });

  it("throws INVALID_URL for an empty string", () => {
    expect(() => validateUrl("")).toThrow(AnalyzeServiceError);
    try {
      validateUrl("");
    } catch (err) {
      expect((err as AnalyzeServiceError).code).toBe("INVALID_URL");
    }
  });

  it("throws INVALID_URL for a plain string without protocol", () => {
    expect(() => validateUrl("example.com")).toThrow(AnalyzeServiceError);
    try {
      validateUrl("example.com");
    } catch (err) {
      expect((err as AnalyzeServiceError).code).toBe("INVALID_URL");
    }
  });

  it("throws INVALID_PROTOCOL for ftp:// URLs", () => {
    expect(() => validateUrl("ftp://example.com")).toThrow(AnalyzeServiceError);
    try {
      validateUrl("ftp://example.com");
    } catch (err) {
      expect((err as AnalyzeServiceError).code).toBe("INVALID_PROTOCOL");
    }
  });
});

describe("analyzePage() — successful request", () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue(makeHtmlResponse(SAMPLE_HTML));
  });

  it("returns the correct HTTP status code", async () => {
    const result = await analyzePage("https://example.com");
    expect(result.status).toBe(200);
  });

  it("returns a responseTime string with 'ms' suffix", async () => {
    const result = await analyzePage("https://example.com");
    expect(result.responseTime).toMatch(/^\d+ ms$/);
  });

  it("extracts the page title", async () => {
    const result = await analyzePage("https://example.com");
    expect(result.title).toBe("Example Domain");
  });

  it("extracts the meta description", async () => {
    const result = await analyzePage("https://example.com");
    expect(result.metaDescription).toBe(
      "This domain is for use in illustrative examples.",
    );
  });

  it("counts H1 elements correctly", async () => {
    const result = await analyzePage("https://example.com");
    expect(result.h1Count).toBe(1);
  });

  it("counts images missing alt attribute", async () => {
    // SAMPLE_HTML has 2 <img> tags; one is missing alt, one has alt="Hero image"
    const result = await analyzePage("https://example.com");
    expect(result.missingAltImages).toBe(1);
  });

  it("returns a positive word count", async () => {
    const result = await analyzePage("https://example.com");
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it("passes the correct User-Agent header to axios", async () => {
    await analyzePage("https://example.com");
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.stringContaining("PagePulse"),
        }),
      }),
    );
  });
});

describe("analyzePage() — invalid URL", () => {
  it("throws INVALID_URL without making any network call", async () => {
    await expect(analyzePage("not-a-url")).rejects.toThrow(AnalyzeServiceError);
    await expect(analyzePage("not-a-url")).rejects.toMatchObject({
      code: "INVALID_URL",
      httpStatus: 400,
    });
    // Network should never have been called
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it("throws for a URL with no protocol", async () => {
    await expect(analyzePage("www.example.com")).rejects.toMatchObject({
      code: "INVALID_URL",
    });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });
});

describe("analyzePage() — timeout", () => {
  it("throws TIMEOUT when axios aborts the connection", async () => {
    // Simulate an axios timeout (ECONNABORTED is what axios throws)
    const timeoutError = Object.assign(new Error("timeout of 10000ms exceeded"), {
      code: "ECONNABORTED",
      isAxiosError: true,
    });
    mockedAxios.get.mockRejectedValue(timeoutError);

    await expect(analyzePage("https://slow-site.example.com")).rejects.toMatchObject({
      code: "TIMEOUT",
      httpStatus: 408,
    });
  });

  it("throws TIMEOUT for ERR_CANCELED (newer axios versions)", async () => {
    const cancelError = Object.assign(new Error("canceled"), {
      code: "ERR_CANCELED",
      isAxiosError: true,
    });
    mockedAxios.get.mockRejectedValue(cancelError);

    await expect(analyzePage("https://example.com")).rejects.toMatchObject({
      code: "TIMEOUT",
      httpStatus: 408,
    });
  });
});

describe("analyzePage() — non-HTML content", () => {
  it("throws NON_HTML_CONTENT for PDF responses", async () => {
    mockedAxios.get.mockResolvedValue(
      makeHtmlResponse("%PDF-1.4...", 200, "application/pdf"),
    );
    await expect(analyzePage("https://example.com/doc.pdf")).rejects.toMatchObject({
      code: "NON_HTML_CONTENT",
      httpStatus: 422,
    });
  });

  it("throws NON_HTML_CONTENT for JSON API responses", async () => {
    mockedAxios.get.mockResolvedValue(
      makeHtmlResponse('{"key":"val"}', 200, "application/json"),
    );
    await expect(analyzePage("https://api.example.com")).rejects.toMatchObject({
      code: "NON_HTML_CONTENT",
      httpStatus: 422,
    });
  });
});

describe("analyzePage() — network errors", () => {
  it("throws DNS_FAILURE for ENOTFOUND", async () => {
    const dnsError = Object.assign(
      new Error("getaddrinfo ENOTFOUND nonexistent.example"),
      { code: "ENOTFOUND", isAxiosError: true },
    );
    mockedAxios.get.mockRejectedValue(dnsError);

    await expect(
      analyzePage("https://nonexistent.example"),
    ).rejects.toMatchObject({ code: "DNS_FAILURE", httpStatus: 400 });
  });
});
