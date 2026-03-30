import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireRecruiter } from "../middleware/recruiter.middleware.js";
import {
	getRecruiterDashboard,
	getRecruiterPublicProfile,
	updateRecruiterCompanyProfile,
} from "../controllers/recruiter.controller.js";

const router = express.Router();

router.get("/company/:username", protectRoute, getRecruiterPublicProfile);
router.get("/dashboard", protectRoute, requireRecruiter, getRecruiterDashboard);
router.put("/company-profile", protectRoute, requireRecruiter, updateRecruiterCompanyProfile);

export default router;

