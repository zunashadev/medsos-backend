import express from "express";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { followUserAccount, getLimitUser, isFollowUser, unfollowUserAccount } from "../controllers/follow.controller.js";

const FollowRouter = express.Router();

FollowRouter.post("/", AuthMiddleware, followUserAccount);
FollowRouter.delete("/:unfollowUserId", AuthMiddleware, unfollowUserAccount);
FollowRouter.get("/user", AuthMiddleware, getLimitUser);
FollowRouter.get("/:followUserId", AuthMiddleware, isFollowUser);

export default FollowRouter;
