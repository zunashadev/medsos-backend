import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const likeFeedUser = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get post ID
    const postId = Number(req.params.postId);

    // Validate request params
    const likeSchema = z.object({
      postId: z.number().int().positive(),
    });

    const validated = likeSchema.parse({ postId });

    // Check target post
    const postData = await prisma.post.findUnique({
      where: {
        id: validated.postId,
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan." });
    }

    // Check existing like
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: validated.postId,
        },
      },
    });

    if (existingLike) {
      // Unlike transaction
      await prisma.$transaction(async (tx) => {
        // Delete like
        await tx.like.delete({
          where: {
            userId_postId: {
              userId: currentUserId,
              postId: validated.postId,
            },
          },
        });

        // Update like count
        await tx.post.update({
          where: {
            id: validated.postId,
          },
          data: {
            likeCount: { decrement: 1 },
          },
        });
      });

      // Send response success - unlike
      return res.status(200).json({ message: "Unlike post/feed berhasil." });
    }

    // Like transaction
    const newLike = await prisma.$transaction(async (tx) => {
      // Create like
      const newLike = await tx.like.create({
        data: {
          userId: currentUserId,
          postId: validated.postId,
        },
      });

      // Update post like count
      await tx.post.update({
        where: {
          id: validated.postId,
        },
        data: {
          likeCount: { increment: 1 },
        },
      });

      return newLike;
    });

    // Send response success - like
    return res
      .status(201)
      .json({ message: "Like post/feed berhasil.", data: newLike });
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

export const checkLikeUser = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get post ID
    const postId = Number(req.params.postId);

    // Validate request params
    const likeSchema = z.object({
      postId: z.number().int().positive(),
    });

    const validated = likeSchema.parse({ postId });

    // Check target post
    const postData = await prisma.post.findUnique({
      where: {
        id: validated.postId,
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan." });
    }

    // Check like status
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: validated.postId,
        },
      },
    });

    // Send response - true
    if (existingLike) {
      return res.status(200).json({ data: true });
    }

    // Send response - false
    return res.status(200).json({ data: false });
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
