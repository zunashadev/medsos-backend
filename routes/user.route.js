import express from "express";
import { getSearchUser, getUserByUsername, updateAvatar, updateUser } from "../controllers/user.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const UserRouter = express.Router();

UserRouter.get("/search", getSearchUser);
UserRouter.get("/:username", getUserByUsername);
UserRouter.put("/update-user", AuthMiddleware, updateUser);
UserRouter.put("/update-photo-profile", AuthMiddleware, upload.single("image"), updateAvatar);

export default UserRouter;
