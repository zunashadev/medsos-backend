import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const createComment = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request body
    const createCommentBodySchema = z.object({
      postId: z.coerce.number().int().positive("Post ID harus valid."),
      content: z
        .string()
        .trim()
        .min(1, "Komentar tidak boleh kosong.")
        .max(255, "Komentar maksimal 255 karakter."),
    });

    const validatedBody = createCommentBodySchema.parse(req.body);

    // Check target post
    const targetPost = await prisma.post.findUnique({
      where: {
        id: validatedBody.postId,
      },
    });

    if (!targetPost) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan." });
    }

    // Create comment transaction
    const createdComment = await prisma.$transaction(async (tx) => {
      // Create comment
      const createdComment = await tx.comment.create({
        data: {
          userId: currentUserId,
          postId: validatedBody.postId,
          content: validatedBody.content,
        },
      });

      // Update post comment count
      await tx.post.update({
        where: {
          id: validatedBody.postId,
        },
        data: {
          commentCount: { increment: 1 },
        },
      });

      return createdComment;
    });

    // Send response success
    return res
      .status(201)
      .json({ message: "Comment berhasil.", data: createdComment });
  } catch (err) {
    // Zod error
    if (err instanceof z.ZodError) {
      const errors = err.issues.map((issue) => issue.message);
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

    // Validate request params
    const deleteCommentParamsSchema = z.object({
      commentId: z.coerce.number().int().positive("Comment ID harus valid."),
    });

    const validatedParams = deleteCommentParamsSchema.parse(req.params);

    // Check target comment
    const targetComment = await prisma.comment.findUnique({
      where: {
        id: validatedParams.commentId,
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
          id: validatedParams.commentId,
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
      const errors = err.issues.map((issue) => issue.message);
      return res.status(400).json({ message: errors });
    }

    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
