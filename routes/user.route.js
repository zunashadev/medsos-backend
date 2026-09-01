import express from "express";
import {
  deleteUser,
  getSearchUser,
  getUserByUsername,
  updateAvatar,
  updateUser,
} from "../controllers/user.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

const UserRouter = express.Router();

UserRouter.get("/search", getSearchUser);
UserRouter.get("/:username", getUserByUsername);
UserRouter.put("/update-user", AuthMiddleware, updateUser);
UserRouter.put(
  "/update-photo-profile",
  AuthMiddleware,
  upload.single("image"),
  updateAvatar,
);

UserRouter.delete(
  "/:userId",
  AuthMiddleware,
  authorizeRoles("ADMIN"),
  deleteUser,
);

export default UserRouter;
