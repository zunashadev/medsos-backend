import express from "express";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { checkLikeUser, likeFeedUser } from "../controllers/like.controller.js";

const LikeRouter = express.Router();

LikeRouter.post("/:postId", AuthMiddleware, likeFeedUser);
LikeRouter.get("/:postId", AuthMiddleware, checkLikeUser);

export default LikeRouter;
