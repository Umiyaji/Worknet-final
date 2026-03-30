import mongoose from "mongoose";
import { randomUUID } from "crypto";
import XLSX from "xlsx";
import Job from "../models/job.model.js";
import Application from "../models/application.model.js";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const excelPreviewStore = new Map();
const PREVIEW_TTL_MS = 15 * 60 * 1000;

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeSkills = (skills) => {
	if (Array.isArray(skills)) {
		return skills.map((skill) => cleanString(skill)).filter(Boolean);
	}

	if (typeof skills === "string") {
		return skills
			.split(/[,\n|]/)
			.map((skill) => cleanString(skill))
			.filter(Boolean);
	}

	return [];
};

const normalizeJobType = (jobType) => {
	const value = cleanString(jobType).toLowerCase();
	if (value === "remote" || value === "on-site" || value === "hybrid") {
		return value;
	}
	if (value === "onsite") {
		return "on-site";
	}
	return "hybrid";
};

const parseLastDateToApply = (value) => {
	if (!value) {
		return null;
	}

	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value;
	}

	if (typeof value === "number") {
		// Excel serial date format fallback
		const excelDate = XLSX.SSF.parse_date_code(value);
		if (excelDate?.y && excelDate?.m && excelDate?.d) {
			const date = new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d));
			return Number.isNaN(date.getTime()) ? null : date;
		}
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeJobPayload = (payload, fallback = {}) => {
	const normalized = {
		title: cleanString(payload.title || fallback.title),
		description: cleanString(payload.description || fallback.description),
		skillsRequired: normalizeSkills(payload.skillsRequired || fallback.skillsRequired),
		experienceRequired: cleanString(payload.experienceRequired || fallback.experienceRequired),
		location: cleanString(payload.location || fallback.location),
		jobType: normalizeJobType(payload.jobType || fallback.jobType),
		salaryRange: cleanString(payload.salaryRange || fallback.salaryRange),
		lastDateToApply: parseLastDateToApply(payload.lastDateToApply || fallback.lastDateToApply),
	};

	return normalized;
};

const validateJobPayload = (payload) => {
	if (!payload.title) return "title is required";
	if (!payload.description) return "description is required";
	if (!payload.experienceRequired) return "experienceRequired is required";
	if (!payload.location) return "location is required";
	if (!payload.lastDateToApply) return "lastDateToApply is required and must be a valid date";
	if (!payload.skillsRequired.length) return "skillsRequired must include at least one skill";
	return "";
};

const parseGeminiText = (data) =>
	data?.candidates?.[0]?.content?.parts
		?.map((part) => part.text)
		.filter(Boolean)
		.join("\n")
		.trim() || "";

const extractJson = (text) => {
	if (!text) {
		return null;
	}

	const cleaned = text
		.replace(/^```json\s*/i, "")
		.replace(/^```\s*/i, "")
		.replace(/\s*```$/i, "")
		.trim();

	try {
		return JSON.parse(cleaned);
	} catch (_error) {
		const start = cleaned.indexOf("{");
		const end = cleaned.lastIndexOf("}");
		if (start === -1 || end === -1 || end <= start) {
			return null;
		}

		try {
			return JSON.parse(cleaned.slice(start, end + 1));
		} catch (_nestedError) {
			return null;
		}
	}
};

const getJobDraftPrompt = (row) => `
Convert this hiring row into a professional job post JSON.
Return strict JSON only with this exact structure:
{
  "title": "",
  "description": "",
  "skillsRequired": ["", ""],
  "experienceRequired": "",
  "location": "",
  "jobType": "remote|on-site|hybrid",
  "salaryRange": "",
  "lastDateToApply": "YYYY-MM-DD"
}
Do not invent unrealistic details. Keep concise and recruiter-friendly.
Source row: ${JSON.stringify(row)}
`.trim();

const aiGenerateJobDraft = async (row) => {
	if (!process.env.GEMINI_API_KEY) {
		return null;
	}

	const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
	const response = await fetch(
		`${GEMINI_API_URL}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				contents: [{ parts: [{ text: getJobDraftPrompt(row) }] }],
				generationConfig: { responseMimeType: "application/json" },
			}),
		}
	);

	const data = await response.json();
	if (!response.ok) {
		throw new Error(data?.error?.message || "AI generation failed");
	}

	return extractJson(parseGeminiText(data));
};

const rowValue = (row, keys) => {
	for (const key of keys) {
		if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined && row[key] !== null) {
			return row[key];
		}
	}
	return "";
};

const rowToFallbackDraft = (row) => ({
	title: rowValue(row, ["title", "jobTitle", "position", "role", "Title", "Job Title"]),
	description: rowValue(row, ["description", "jobDescription", "details", "Description"]),
	skillsRequired: rowValue(row, ["skillsRequired", "skills", "Skills", "skill_set"]),
	experienceRequired: rowValue(row, ["experienceRequired", "experience", "Experience"]),
	location: rowValue(row, ["location", "jobLocation", "Location"]),
	jobType: rowValue(row, ["jobType", "type", "workMode", "Job Type"]),
	salaryRange: rowValue(row, ["salaryRange", "salary", "Salary"]),
	lastDateToApply: rowValue(row, ["lastDateToApply", "lastDate", "deadline", "Last Date To Apply"]),
});

const cleanupPreviewStore = () => {
	const now = Date.now();
	for (const [token, entry] of excelPreviewStore.entries()) {
		if (entry.expiresAt <= now) {
			excelPreviewStore.delete(token);
		}
	}
};

export const createJob = async (req, res) => {
	try {
		const payload = normalizeJobPayload(req.body);
		const validationError = validateJobPayload(payload);

		if (validationError) {
			return res.status(400).json({ message: validationError });
		}

		const job = await Job.create({
			...payload,
			companyId: req.user._id,
		});

		const populatedJob = await Job.findById(job._id).populate(
			"companyId",
			"name username companyName companyLogo industry companyLocation"
		);

		return res.status(201).json(populatedJob);
	} catch (error) {
		console.error("Error in createJob controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const updateJob = async (req, res) => {
	try {
		const { jobId } = req.params;
		if (!mongoose.Types.ObjectId.isValid(jobId)) {
			return res.status(400).json({ message: "Invalid job id" });
		}

		const existingJob = await Job.findById(jobId);
		if (!existingJob) {
			return res.status(404).json({ message: "Job not found" });
		}

		if (existingJob.companyId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "You can update only your own jobs" });
		}

		const payload = normalizeJobPayload(req.body, existingJob.toObject());
		const validationError = validateJobPayload(payload);
		if (validationError) {
			return res.status(400).json({ message: validationError });
		}

		const updatedJob = await Job.findByIdAndUpdate(jobId, payload, { new: true }).populate(
			"companyId",
			"name username companyName companyLogo industry companyLocation"
		);

		return res.json(updatedJob);
	} catch (error) {
		console.error("Error in updateJob controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const deleteJob = async (req, res) => {
	try {
		const { jobId } = req.params;
		if (!mongoose.Types.ObjectId.isValid(jobId)) {
			return res.status(400).json({ message: "Invalid job id" });
		}

		const existingJob = await Job.findById(jobId);
		if (!existingJob) {
			return res.status(404).json({ message: "Job not found" });
		}

		if (existingJob.companyId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "You can delete only your own jobs" });
		}

		await Job.findByIdAndDelete(jobId);
		await Application.deleteMany({ jobId });
		return res.json({ message: "Job deleted successfully" });
	} catch (error) {
		console.error("Error in deleteJob controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const getRecruiterJobs = async (req, res) => {
	try {
		const jobs = await Job.find({ companyId: req.user._id }).sort({ createdAt: -1 });
		return res.json(jobs);
	} catch (error) {
		console.error("Error in getRecruiterJobs controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const getAllJobs = async (req, res) => {
	try {
		const { search = "", location = "", jobType = "" } = req.query;
		const filter = {};

		if (search) {
			filter.$or = [
				{ title: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
				{ skillsRequired: { $regex: search, $options: "i" } },
			];
		}

		if (location) {
			filter.location = { $regex: location, $options: "i" };
		}

		if (jobType && ["remote", "on-site", "hybrid"].includes(jobType)) {
			filter.jobType = jobType;
		}

		const jobs = await Job.find(filter)
			.populate("companyId", "name username companyName companyLogo industry companyLocation")
			.sort({ createdAt: -1 });

		return res.json(jobs);
	} catch (error) {
		console.error("Error in getAllJobs controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const getJobById = async (req, res) => {
	try {
		const { jobId } = req.params;
		if (!mongoose.Types.ObjectId.isValid(jobId)) {
			return res.status(400).json({ message: "Invalid job id" });
		}

		const job = await Job.findById(jobId).populate(
			"companyId",
			"name username companyName companyLogo companyBanner aboutCompany industry companyLocation companyWebsite"
		);
		if (!job) {
			return res.status(404).json({ message: "Job not found" });
		}

		const totalApplicants = await Application.countDocuments({ jobId });
		return res.json({ ...job.toObject(), totalApplicants });
	} catch (error) {
		console.error("Error in getJobById controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const applyToJob = async (req, res) => {
	try {
		const { jobId } = req.params;
		const coverLetter = cleanString(req.body?.coverLetter);

		if (!mongoose.Types.ObjectId.isValid(jobId)) {
			return res.status(400).json({ message: "Invalid job id" });
		}

		if (req.user.role === "recruiter") {
			return res.status(403).json({ message: "Recruiters cannot apply to jobs" });
		}

		const job = await Job.findById(jobId);
		if (!job) {
			return res.status(404).json({ message: "Job not found" });
		}

		if (job.companyId.toString() === req.user._id.toString()) {
			return res.status(400).json({ message: "You cannot apply to your own job" });
		}

		const existingApplication = await Application.findOne({ userId: req.user._id, jobId });
		if (existingApplication) {
			return res.status(400).json({ message: "You already applied for this job" });
		}

		const application = await Application.create({
			userId: req.user._id,
			jobId,
			coverLetter,
		});

		return res.status(201).json(application);
	} catch (error) {
		console.error("Error in applyToJob controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const getApplicantsForJob = async (req, res) => {
	try {
		const { jobId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(jobId)) {
			return res.status(400).json({ message: "Invalid job id" });
		}

		const job = await Job.findById(jobId);
		if (!job) {
			return res.status(404).json({ message: "Job not found" });
		}

		if (job.companyId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "You can view applicants only for your jobs" });
		}

		const applicants = await Application.find({ jobId })
			.populate("userId", "name username email profilePicture headline skills experience education")
			.sort({ createdAt: -1 });

		return res.json(applicants);
	} catch (error) {
		console.error("Error in getApplicantsForJob controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const getMyApplications = async (req, res) => {
	try {
		const applications = await Application.find({ userId: req.user._id })
			.populate({
				path: "jobId",
				populate: {
					path: "companyId",
					select: "name username companyName companyLogo industry companyLocation",
				},
			})
			.sort({ createdAt: -1 });

		return res.json(applications);
	} catch (error) {
		console.error("Error in getMyApplications controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const uploadExcelPreview = async (req, res) => {
	try {
		cleanupPreviewStore();

		if (!req.file) {
			return res.status(400).json({ message: "Excel file is required" });
		}

		const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
		const firstSheet = workbook.SheetNames[0];
		if (!firstSheet) {
			return res.status(400).json({ message: "No worksheet found in file" });
		}

		const worksheet = workbook.Sheets[firstSheet];
		const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
		if (!rows.length) {
			return res.status(400).json({ message: "No rows found in uploaded Excel file" });
		}

		const previewDrafts = [];
		for (let index = 0; index < rows.length; index += 1) {
			const row = rows[index];
			const fallbackDraft = rowToFallbackDraft(row);

			let aiDraft = null;
			try {
				aiDraft = await aiGenerateJobDraft(row);
			} catch (aiError) {
				console.error(`AI generation failed for row ${index + 1}:`, aiError.message);
			}

			const normalized = normalizeJobPayload(aiDraft || fallbackDraft, fallbackDraft);
			previewDrafts.push({
				rowNumber: index + 1,
				sourceRow: row,
				draft: normalized,
				validationError: validateJobPayload(normalized),
			});
		}

		const previewToken = randomUUID();
		excelPreviewStore.set(previewToken, {
			companyId: req.user._id.toString(),
			drafts: previewDrafts,
			expiresAt: Date.now() + PREVIEW_TTL_MS,
		});

		return res.json({
			previewToken,
			totalRows: previewDrafts.length,
			validRows: previewDrafts.filter((entry) => !entry.validationError).length,
			drafts: previewDrafts,
		});
	} catch (error) {
		console.error("Error in uploadExcelPreview controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

export const publishExcelJobs = async (req, res) => {
	try {
		cleanupPreviewStore();

		const previewToken = cleanString(req.body?.previewToken);
		if (!previewToken) {
			return res.status(400).json({ message: "previewToken is required" });
		}

		const previewEntry = excelPreviewStore.get(previewToken);
		if (!previewEntry || previewEntry.expiresAt <= Date.now()) {
			excelPreviewStore.delete(previewToken);
			return res.status(400).json({ message: "Preview expired. Please upload the Excel file again." });
		}

		if (previewEntry.companyId !== req.user._id.toString()) {
			return res.status(403).json({ message: "You can publish only your own preview" });
		}

		const validDrafts = previewEntry.drafts.filter((entry) => !entry.validationError).map((entry) => entry.draft);
		if (!validDrafts.length) {
			return res.status(400).json({ message: "No valid jobs to publish" });
		}

		const insertedJobs = await Job.insertMany(
			validDrafts.map((draft) => ({
				...draft,
				companyId: req.user._id,
			}))
		);

		excelPreviewStore.delete(previewToken);

		return res.status(201).json({
			message: "Jobs published successfully",
			publishedCount: insertedJobs.length,
			jobs: insertedJobs,
		});
	} catch (error) {
		console.error("Error in publishExcelJobs controller:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

