import mongoose from "mongoose";

const jobDetailsSchema = new mongoose.Schema(
	{
		companyName: { type: String, trim: true },
		role: { type: String, trim: true },
		totalOpenings: { type: Number, min: 1 },
		experienceRequired: { type: String, trim: true },
		workMode: {
			type: String,
			enum: ["Remote", "In Office", "Hybrid"],
		},
		officeLocation: { type: String, trim: true },
		skillsRequired: [{ type: String, trim: true }],
		lastDateToApply: { type: Date },
		source: { type: String, trim: true },
		sourceRowId: { type: String, trim: true },
	},
	{ _id: false }
);

const postSchema = new mongoose.Schema(
	{
		author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		postType: {
			type: String,
			enum: ["normal", "job"],
			default: "normal",
		},
		content: { type: String },
		image: { type: String },
		jobDetails: { type: jobDetailsSchema, default: null },
		likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		comments: [
			{
				content: { type: String },
				user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
				createdAt: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
