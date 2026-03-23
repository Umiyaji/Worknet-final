import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import validator from "validator";
import { OAuth2Client } from "google-auth-library";



const COOKIE_OPTIONS = {
	httpOnly: true,
	maxAge: 3 * 24 * 60 * 60 * 1000,
	sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
	secure: process.env.NODE_ENV === "production",
};


export const signup = async (req, res) => {
	try {
		let { name, username, email, password } = req.body;

		// ---------- Basic validation ----------
		if (!name || !username || !email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		email = email.toLowerCase().trim();
		username = username.toLowerCase().trim();

		if (!validator.isEmail(email)) {
			return res.status(400).json({ message: "Invalid email address" });
		}

		// ---------- Gmail-only restriction ----------
		if (!email.endsWith("@gmail.com")) {
			return res.status(400).json({
				message: "Only Gmail addresses are allowed",
			});
		}

		// ---------- Check duplicates ----------
		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ message: "Email already exists" });
		}

		
		const existingUsername = await User.findOne({ username });
		if (existingUsername) {
			return res.status(400).json({ message: "Username already taken" });
		}

		// ---------- Password hashing ----------
		const hashedPassword = await bcrypt.hash(password, 10);

		// ---------- Create user ----------
		const user = new User({
			name,
			email,
			username,
			password: hashedPassword,
		});

		await user.save();

		// ---------- JWT ----------
		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET,
			{ expiresIn: "3d" }
		);

		res.cookie("jwt-linkedin", token, COOKIE_OPTIONS);

		// ---------- Response ----------
		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
		});

		// ---------- Welcome email (non-blocking) ----------
		const profileUrl = `${process.env.CLIENT_URL}/profile/${user.username}`;
		sendWelcomeEmail(user.email, user.name, profileUrl)
			.catch(err => console.error("Email failed:", err.message));

	} catch (error) {
		console.error("Error in signup:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};


export const login = async (req, res) => {
	try {
		const { username, password } = req.body;

		const user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

		res.cookie("jwt-linkedin", token, COOKIE_OPTIONS);

		res.json({ message: "Logged in successfully" });
	} catch (error) {
		console.error("Error in login controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};


export const logout = (req, res) => {
	res.clearCookie("jwt-linkedin", {
		httpOnly: true,
		sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
		secure: process.env.NODE_ENV === "production",
	});
	res.json({ message: "Logged out successfully" });
};


export const getCurrentUser = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		console.error("Error in getCurrentUser controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};


export const googleAuth = async (req, res) => {
	try {
		const { token } = req.body;

		if (!token) {
			return res.status(400).json({ message: "Token is required" });
		}

		// Verify the Google token
		const client = new OAuth2Client(process.env.VITE_APP_GOOGLE_AUTH_KEY);
		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: process.env.VITE_APP_GOOGLE_AUTH_KEY,
		});

		const payload = ticket.getPayload();
		const { email, name, picture } = payload;

		if (!email) {
			return res.status(400).json({ message: "Could not retrieve email from Google" });
		}

		// Check if user exists
		let user = await User.findOne({ email });

		if (!user) {
			// Create new user
			const username = email.split("@")[0] + Math.random().toString(36).substring(7);
			
			user = new User({
				name: name || "User",
				email,
				username,
				password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
				profilePicture: picture || "",
			});

			await user.save();

			// Send welcome email
			const profileUrl = `${process.env.CLIENT_URL}/profile/${user.username}`;
			sendWelcomeEmail(user.email, user.name, profileUrl)
				.catch(err => console.error("Email failed:", err.message));
		}

		// Create JWT token
		const jwtToken = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET,
			{ expiresIn: "3d" }
		);

		res.cookie("jwt-linkedin", jwtToken, COOKIE_OPTIONS);

		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
		});

	} catch (error) {
		console.error("Error in googleAuth controller:", error);
		res.status(500).json({ message: "Google authentication failed" });
	}
};



