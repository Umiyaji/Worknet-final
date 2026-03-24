const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const supportedTextMimeTypes = new Set([
	"text/plain",
	"text/csv",
	"application/json",
	"text/markdown",
	"text/x-markdown",
]);

const supportedImageMimeTypes = new Set([
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/webp",
]);

const getPromptTemplate = (userPrompt, fileContextLabel = "") => [
	"You are helping a user draft a social post.",
	"Follow the user's request exactly.",
	"Keep the response publish-ready and natural for a professional social platform.",
	"Do not add facts that are not present in the user's prompt or attached file context.",
	"Return only the draft post text with no extra commentary or quotation marks.",
	fileContextLabel ? `Attached context: ${fileContextLabel}` : "",
	"",
	`User request: ${userPrompt}`,
]
	.filter(Boolean)
	.join("\n");

const extractTextFromFile = (file) => {
	if (!supportedTextMimeTypes.has(file.mimetype)) {
		return null;
	}

	return file.buffer.toString("utf-8").trim();
};

const buildGeminiParts = ({ prompt, file }) => {
	const parts = [{ text: getPromptTemplate(prompt, file?.originalname) }];

	if (!file) {
		return parts;
	}

	if (supportedTextMimeTypes.has(file.mimetype)) {
		const fileText = extractTextFromFile(file);
		if (fileText) {
			parts.push({
				text: `File content:\n${fileText}`,
			});
		}
		return parts;
	}

	if (supportedImageMimeTypes.has(file.mimetype)) {
		parts.push({
			inline_data: {
				mime_type: file.mimetype,
				data: file.buffer.toString("base64"),
			},
		});
	}

	return parts;
};

const parseGeminiText = (data) =>
	data?.candidates?.[0]?.content?.parts
		?.map((part) => part.text)
		.filter(Boolean)
		.join("\n")
		.trim() || "";

export const generatePostDraft = async (req, res) => {
	try {
		const prompt = String(req.body?.prompt || "").trim();
		const file = req.file || null;

		if (!prompt) {
			return res.status(400).json({ message: "Prompt is required" });
		}

		if (!process.env.GEMINI_API_KEY) {
			return res.status(500).json({ message: "GEMINI_API_KEY is not configured" });
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
					contents: [
						{
							parts: buildGeminiParts({ prompt, file }),
						},
					],
				}),
			}
		);

		const data = await response.json();
		if (!response.ok) {
			console.error("Gemini API error:", data);
			return res.status(502).json({
				message: data?.error?.message || "Failed to generate AI draft",
			});
		}

		const draft = parseGeminiText(data);
		if (!draft) {
			return res.status(502).json({ message: "Gemini returned an empty draft" });
		}

		res.status(200).json({
			draft,
			model,
			fileUsed: file?.originalname || null,
		});
	} catch (error) {
		console.error("Error in generatePostDraft controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};
