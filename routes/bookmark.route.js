import express from "express";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { checkSavedFeed, toggleSaveFeed } from "../controllers/bookmark.controller.js";

const BookmarkRouter = express.Router();

BookmarkRouter.post("/:postId", AuthMiddleware, toggleSaveFeed);
BookmarkRouter.get("/:postId", AuthMiddleware, checkSavedFeed);

export default BookmarkRouter;
