/**
 * analyzeController.ts
 * Handles HTTP request/response for the POST /analyze endpoint.
 * Delegates all business logic to analyzeService.
 * MVC pattern: Controller knows about HTTP, Service knows about analysis.
 */

import { type Request, type Response } from "express";
import { AnalyzeUrlBody } from "@workspace/api-zod";
import {
  analyzePage,
  AnalyzeServiceError,
} from "../services/analyzeService.js";

/**
 * POST /analyze
 * Expects JSON body: { url: string }
 * Returns AnalyzeResult or an error object with an error code.
 */
export async function analyzeUrlController(
  req: Request,
  res: Response,
): Promise<void> {
  // ── Input validation (Zod schema from generated spec) ──────────────────────
  const parseResult = AnalyzeUrlBody.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: "Invalid request body — 'url' field is required",
      code: "INVALID_REQUEST",
    });
    return;
  }

  const { url } = parseResult.data;

  // ── Delegate to service layer ───────────────────────────────────────────────
  try {
    const result = await analyzePage(url);
    res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof AnalyzeServiceError) {
      // Known, expected errors — return appropriate HTTP status + structured body
      res.status(err.httpStatus).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    // Unknown errors — log them and return a generic 500
    req.log.error({ err, url }, "Unexpected error in analyzeUrlController");
    res.status(500).json({
      error: "An unexpected internal error occurred",
      code: "INTERNAL_ERROR",
    });
  }
}
