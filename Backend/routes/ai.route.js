import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generatePostDraft } from "../controllers/ai.controller.js";
import { uploadAiContextFile } from "../middleware/aiUpload.middleware.js";

const router = express.Router();

router.post("/generate-post-draft", protectRoute, uploadAiContextFile, generatePostDraft);

export default router;
