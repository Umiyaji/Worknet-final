import multer from "multer";

// Configure multer to use memory storage (file will be stored in memory as buffer)
const storage = multer.memoryStorage();

// File filter to only accept images
const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("Only image files are allowed"), false);
	}
};

// Configure multer
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
});

// Middleware that handles both JSON and multipart/form-data requests
export const uploadSingle = (req, res, next) => {
	const contentType = req.headers["content-type"] || "";
	console.log("Upload middleware - Content-Type:", contentType);
	
	// Only use multer if Content-Type is multipart/form-data
	if (contentType.includes("multipart/form-data")) {
		console.log("Processing multipart/form-data with multer");
		upload.single("image")(req, res, (err) => {
			if (err) {
				console.error("Multer error:", err);
				// Handle multer errors
				if (err instanceof multer.MulterError) {
					if (err.code === "LIMIT_FILE_SIZE") {
						return res.status(400).json({ message: "File too large. Maximum size is 5MB" });
					}
					return res.status(400).json({ message: err.message });
				}
				// Handle other errors (like fileFilter errors)
				return res.status(400).json({ message: err.message || "File upload error" });
			}
			console.log("Multer processing complete - File:", req.file ? "present" : "not present");
			next();
		});
	} else {
		// Skip multer for JSON requests
		console.log("Skipping multer for non-multipart request");
		next();
	}
};
