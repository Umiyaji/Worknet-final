import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		username: { type: String, required: true, unique: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		profilePicture: {
			type: String,
			default: "",
		},
		bannerImg: {
			type: String,
			default: "",
		},
		headline: {
			type: String,
			default: "Worknet User",
		},
		location: {
			type: String,
			default: "India",
		},
		currentCompany: {
			type: String,
			default: "",
		},
		about: {
			type: String,
			default: "",
		},
		skills: [String],
		resume: {
			type: String,
			default: "",
		},
		experience: [
			{
				title: { type: String },
				company: { type: String },
				startDate: { type: Date },
				endDate: { type: Date },
				description: { type: String },
			},
		],
		education: [
			{
				school: { type: String },
				fieldOfStudy: { type: String },
				startYear: { type: Number },
				endYear: { type: Number },
			},
		],
		connections: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
