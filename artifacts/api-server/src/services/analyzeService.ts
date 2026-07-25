/**
 * analyzeService.ts
 * Core business logic for URL analysis.
 * Fetches the target URL with axios, parses HTML with Cheerio,
 * and extracts SEO / performance metrics.
 */

import axios, { type AxiosResponse } from "axios";
import * as cheerio from "cheerio";

/** Timeout in milliseconds before we give up on a slow URL */
const TIMEOUT_MS = 10_000;

/** The shape returned on a successful analysis */
export interface AnalyzeResult {
  status: number;
  responseTime: string;
  title: string;
  metaDescription: string;
  h1Count: number;
  missingAltImages: number;
  wordCount: number;
}

/** Typed error thrown by service functions so controllers can map to HTTP codes */
export class AnalyzeServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number = 400,
  ) {
    super(message);
    this.name = "AnalyzeServiceError";
  }
}

/**
 * Validate that a string is a well-formed http/https URL.
 * Throws AnalyzeServiceError on failure so callers don't need to handle
 * raw URL-parsing exceptions.
 */
export function validateUrl(url: string): void {
  if (!url || typeof url !== "string") {
    throw new AnalyzeServiceError("URL is required", "INVALID_URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AnalyzeServiceError(
      "Invalid URL format — must be a fully qualified URL",
      "INVALID_URL",
    );
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AnalyzeServiceError(
      "Only http and https URLs are supported",
      "INVALID_PROTOCOL",
    );
  }
}

/**
 * Fetch a URL, parse the HTML, and return extracted metrics.
 * Never throws plain Error — always AnalyzeServiceError.
 */
export async function analyzePage(url: string): Promise<AnalyzeResult> {
  // Validate before making any network call
  validateUrl(url);

  const startTime = Date.now();

  let response: AxiosResponse<string>;

  try {
    response = await axios.get<string>(url, {
      timeout: TIMEOUT_MS,
      // Identify ourselves in the User-Agent so servers don't block us
      headers: {
        "User-Agent": "PagePulse/1.0 URL Analyzer",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      maxRedirects: 5,
      // We want to inspect all status codes, not just throw on 4xx/5xx
      validateStatus: () => true,
      responseType: "text",
    });
  } catch (err: unknown) {
    // Map axios / Node network errors to typed AnalyzeServiceError
    if (axios.isAxiosError(err)) {
      const code = err.code ?? "";
      if (code === "ECONNABORTED" || code === "ERR_CANCELED") {
        throw new AnalyzeServiceError(
          `Request timed out after ${TIMEOUT_MS / 1000}s`,
          "TIMEOUT",
          408,
        );
      }
      if (code === "ENOTFOUND") {
        throw new AnalyzeServiceError(
          "DNS lookup failed — the domain could not be found",
          "DNS_FAILURE",
          400,
        );
      }
      if (code === "ECONNREFUSED") {
        throw new AnalyzeServiceError(
          "Connection refused by the server",
          "CONNECTION_REFUSED",
          400,
        );
      }
      throw new AnalyzeServiceError(
        `Failed to fetch URL: ${err.message}`,
        "FETCH_ERROR",
        400,
      );
    }
    throw new AnalyzeServiceError(
      "An unexpected error occurred while fetching the URL",
      "FETCH_ERROR",
      500,
    );
  }

  const responseTime = `${Date.now() - startTime} ms`;
  const httpStatus = response.status;

  // Reject non-HTML responses (PDFs, images, JSON APIs, etc.)
  const contentType = (response.headers["content-type"] as string) ?? "";
  if (!contentType.includes("text/html")) {
    throw new AnalyzeServiceError(
      `Expected HTML content but received: ${contentType.split(";")[0].trim()}`,
      "NON_HTML_CONTENT",
      422,
    );
  }

  const html = response.data as string;

  // Load HTML into Cheerio for DOM-style querying
  const $ = cheerio.load(html);

  // ── Metric extraction ───────────────────────────────────────────────────────

  const title = $("title").first().text().trim();

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ??
    $('meta[property="og:description"]').attr("content")?.trim() ??
    "";

  const h1Count = $("h1").length;

  // Count <img> tags that are missing an alt attribute entirely
  let missingAltImages = 0;
  $("img").each((_, el) => {
    if ($(el).attr("alt") === undefined) {
      missingAltImages++;
    }
  });

  // Approximate word count: strip scripts/styles then count whitespace-delimited tokens
  $("script, style, noscript, head").remove();
  const bodyText = ($("body").text() || $("*").text())
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = bodyText
    ? bodyText.split(" ").filter((w) => w.length > 0).length
    : 0;

  return {
    status: httpStatus,
    responseTime,
    title,
    metaDescription,
    h1Count,
    missingAltImages,
    wordCount,
  };
}
