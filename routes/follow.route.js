import express from "express";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import {
  followUserAccount,
  getSuggestedUsers,
  isFollowUser,
  unfollowUserAccount,
} from "../controllers/follow.controller.js";

const FollowRouter = express.Router();

FollowRouter.post("/:userId", AuthMiddleware, followUserAccount);
FollowRouter.delete("/:userId", AuthMiddleware, unfollowUserAccount);
FollowRouter.get("/suggestions", AuthMiddleware, getSuggestedUsers);
FollowRouter.get("/:userId", AuthMiddleware, isFollowUser);

export default FollowRouter;
