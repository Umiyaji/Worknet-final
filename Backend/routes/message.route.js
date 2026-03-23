import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	deleteMessage,
	getConversations,
	getMessagesWithUser,
	markConversationAsRead,
	sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.delete("/message/:messageId", protectRoute, deleteMessage);
router.put("/read/:userId", protectRoute, markConversationAsRead);
router.get("/:userId", protectRoute, getMessagesWithUser);
router.post("/:userId", protectRoute, sendMessage);

export default router;
