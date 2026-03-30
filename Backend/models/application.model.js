import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		jobId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Job",
			required: true,
			index: true,
		},
		coverLetter: {
			type: String,
			default: "",
			trim: true,
		},
		status: {
			type: String,
			enum: ["applied", "reviewing", "shortlisted", "rejected", "hired"],
			default: "applied",
		},
	},
	{ timestamps: true }
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;

