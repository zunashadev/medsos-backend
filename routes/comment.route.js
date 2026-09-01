import express from "express";
import { AuthMiddleware } from "../middleware/auth.middleware.js";
import {
  createComment,
  deleteCommentById,
} from "../controllers/comment.controller.js";

const CommentRouter = express.Router();

CommentRouter.post("/", AuthMiddleware, createComment);
CommentRouter.delete("/:commentId", AuthMiddleware, deleteCommentById);

export default CommentRouter;
