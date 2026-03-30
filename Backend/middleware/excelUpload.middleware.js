import multer from "multer";

const allowedMimeTypes = new Set([
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.ms-excel",
	"text/csv",
]);

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
	fileFilter: (_req, file, cb) => {
		if (allowedMimeTypes.has(file.mimetype) || /\.(xlsx|xls|csv)$/i.test(file.originalname)) {
			cb(null, true);
			return;
		}

		cb(new Error("Only Excel files (.xlsx, .xls) or CSV are allowed"), false);
	},
});

export const uploadExcelFile = (req, res, next) => {
	upload.single("file")(req, res, (err) => {
		if (!err) {
			next();
			return;
		}

		if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
			return res.status(400).json({ message: "File too large. Maximum size is 10MB" });
		}

		return res.status(400).json({ message: err.message || "Excel upload failed" });
	});
};

