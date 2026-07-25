/**
 * analyze.ts — Route definitions for the /analyze endpoint.
 * Kept thin: just maps HTTP verbs + paths to controller functions.
 */

import { Router, type IRouter } from "express";
import { analyzeUrlController } from "../controllers/analyzeController.js";

const router: IRouter = Router();

/**
 * POST /api/analyze
 * Analyze a URL and return SEO/performance metrics.
 */
router.post("/analyze", analyzeUrlController);

export default router;
