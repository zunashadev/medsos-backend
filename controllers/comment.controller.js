import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const createComment = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get post ID & content
    const postId = Number(req.body.postId);
    const content = req.body.content;

    // Validate request body
    const commentSchema = z.object({
      postId: z.number().int().positive(),
      content: z.string().trim().min(1).max(255),
    });

    const validated = commentSchema.parse({ postId, content });

    // Check target post
    const targetPost = await prisma.post.findUnique({
      where: {
        id: validated.postId,
      },
    });

    if (!targetPost) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan." });
    }

    // Create comment transaction
    const newComment = await prisma.$transaction(async (tx) => {
      // Create comment
      const newComment = await tx.comment.create({
        data: {
          userId: currentUserId,
          postId: validated.postId,
          content: validated.content,
        },
      });

      // Update post comment count
      await tx.post.update({
        where: {
          id: validated.postId,
        },
        data: {
          commentCount: { increment: 1 },
        },
      });

      return newComment;
    });

    // Send response success
    return res
      .status(201)
      .json({ message: "Comment berhasil.", data: newComment });
  } catch (err) {
    // Zod error
    if (err instanceof z.ZodError) {
      const errors = err.issues.map((i) => i.message);
      return res.status(400).json({ message: errors });
    }

    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteCommentById = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get comment ID
    const commentId = Number(req.params.id);

    // Validate request params
    const commentSchema = z.object({
      commentId: z.number().int().positive(),
    });

    const validated = commentSchema.parse({ commentId });

    // Check target comment
    const targetComment = await prisma.comment.findUnique({
      where: {
        id: validated.commentId,
      },
    });

    if (!targetComment) {
      return res.status(404).json({ message: "Comment tidak ditemukan." });
    }

    // Check comment ownership
    if (targetComment.userId !== currentUserId) {
      return res
        .status(403)
        .json({ message: "Anda tidak bisa menghapus komentar user lain." });
    }

    // Delete comment transaction
    await prisma.$transaction(async (tx) => {
      // Delete comment
      await tx.comment.delete({
        where: {
          id: validated.commentId,
        },
      });

      // Update post comment count
      await tx.post.update({
        where: {
          id: targetComment.postId,
        },
        data: {
          commentCount: { decrement: 1 },
        },
      });
    });

    // Send response success
    return res.status(200).json({ message: "Delete comment berhasil." });
  } catch (err) {
    // Zod error
    if (err instanceof z.ZodError) {
      const errors = err.issues.map((i) => i.message);
      return res.status(400).json({ message: errors });
    }

    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
