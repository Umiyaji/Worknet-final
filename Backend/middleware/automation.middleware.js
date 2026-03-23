export const protectAutomationRoute = (req, res, next) => {
	try {
		const providedKey = req.headers["x-automation-key"];
		const expectedKey = process.env.AUTOMATION_API_KEY;

		if (!expectedKey) {
			return res.status(500).json({ message: "Automation API key is not configured" });
		}

		if (!providedKey || providedKey !== expectedKey) {
			return res.status(401).json({ message: "Unauthorized automation request" });
		}

		next();
	} catch (error) {
		console.error("Error in protectAutomationRoute middleware:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
