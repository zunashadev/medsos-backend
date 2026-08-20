import express from "express";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { createFeed, deleteFeed, detailFeed, readAllFeed } from "../controllers/feed.controller.js";

const FeedRouter = express.Router();

FeedRouter.post("/", AuthMiddleware, upload.single("image"), createFeed);
FeedRouter.get("/", AuthMiddleware, readAllFeed);
FeedRouter.get("/:id", AuthMiddleware, detailFeed);
FeedRouter.delete("/:id", AuthMiddleware, deleteFeed);

export default FeedRouter;
