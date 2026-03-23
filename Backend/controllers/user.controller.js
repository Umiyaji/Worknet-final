import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs/promises";
import path from "path";

const deleteLocalResumeIfExists = async (resumeUrl) => {
	if (!resumeUrl || !resumeUrl.includes("/uploads/resumes/")) {
		return;
	}

	try {
		const fileName = resumeUrl.split("/uploads/resumes/")[1];
		if (!fileName) {
			return;
		}

		const filePath = path.resolve("uploads", "resumes", fileName);
		await fs.unlink(filePath);
	} catch (error) {
		if (error.code !== "ENOENT") {
			console.error("Error deleting local resume file:", error);
		}
	}
};


export const getSuggestedConnections = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user._id).select("connections");

		const limit = parseInt(req.query.limit, 10) || 0;

		const query = User.find({
			_id: {
				$ne: req.user._id,
				$nin: currentUser.connections,
			},
		}).select("name username profilePicture headline");

		if (limit > 0) {
			query.limit(limit);
		}

		const suggestedUsers = await query;

		res.json(suggestedUsers);
	} catch (error) {
		console.error("Error in getSuggestedConnections controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPublicProfile = async (req, res) => {
	try {
		const user = await User.findOne({ username: req.params.username }).select("-password");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json(user);
	} catch (error) {
		console.error("Error in getPublicProfile controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const allowedFields = [
			"name",
			"username",
			"headline",
			"about",
			"location",
			"currentCompany",
			"profilePicture",
			"bannerImg",
			"resume",
			"skills",
			"experience",
			"education",
		];

		const updatedData = {};

		for (const field of allowedFields) {
			if (Object.prototype.hasOwnProperty.call(req.body, field)) {
				updatedData[field] = req.body[field];
			}
		}

		if (req.body.profilePicture) {
			const result = await cloudinary.uploader.upload(req.body.profilePicture);
			updatedData.profilePicture = result.secure_url;
		}

		if (req.body.bannerImg) {
			const result = await cloudinary.uploader.upload(req.body.bannerImg);
			updatedData.bannerImg = result.secure_url;
		}

		if (req.body.resume) {
			const result = await cloudinary.uploader.upload(req.body.resume, {
				resource_type: "auto",
			});
			updatedData.resume = result.secure_url;
		}

		const user = await User.findByIdAndUpdate(req.user._id, { $set: updatedData }, { new: true }).select(
			"-password"
		);

		res.json(user);
	} catch (error) {
		console.error("Error in updateProfile controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const uploadResume = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: "Resume file is required" });
		}

		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		await deleteLocalResumeIfExists(user.resume);

		const resumeUrl = `${req.protocol}://${req.get("host")}/uploads/resumes/${req.file.filename}`;
		user.resume = resumeUrl;
		await user.save();

		res.json(user);
	} catch (error) {
		console.error("Error uploading resume:", error);
		res.status(500).json({ message: "Server error" });
	}
};


// Delete profile picture
export const deleteProfilePicture = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: "User not found" });

		user.profilePicture = null;
		await user.save();

		res.json({ message: "Profile picture deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

// Delete banner image
export const deleteBannerImage = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: "User not found" });

		user.bannerImg = null;
		await user.save();

		res.json({ message: "Banner image deleted successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const deleteResume = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: "User not found" });

		await deleteLocalResumeIfExists(user.resume);
		user.resume = "";
		await user.save();

		const updatedUser = await User.findById(req.user.id).select("-password");
		res.json(updatedUser);
	} catch (error) {
		console.error("Error deleting resume:", error);
		res.status(500).json({ message: "Server error" });
	}
};



export const searchUsers = async (req, res) => {
	try {
		const { query } = req.query;

		if (!query) {
			return res.status(400).json({ message: "Search query is required." });
		}

		const users = await User.find({
			$or: [
				{ name: { $regex: query, $options: 'i' } },
				{ username: { $regex: query, $options: 'i' } }
			]
		})
			.select('name username profilePicture')
			.limit(10);

		res.status(200).json(users);
	} catch (error) {
		console.error("Error searching for users:", error);
		res.status(500).json({ message: "Internal server error." });
	}
};
