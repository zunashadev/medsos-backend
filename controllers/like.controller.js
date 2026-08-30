import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const likeFeedUser = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request params
    const likeFeedUserParamsSchema = z.object({
      postId: z.coerce.number().int().positive("Post ID harus valid."),
    });

    const validatedParams = likeFeedUserParamsSchema.parse(req.params);

    // Check target post
    const postData = await prisma.post.findUnique({
      where: {
        id: validatedParams.postId,
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
          postId: validatedParams.postId,
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
              postId: validatedParams.postId,
            },
          },
        });

        // Update like count
        await tx.post.update({
          where: {
            id: validatedParams.postId,
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
    const createdLike = await prisma.$transaction(async (tx) => {
      // Create like
      const createdLike = await tx.like.create({
        data: {
          userId: currentUserId,
          postId: validatedParams.postId,
        },
      });

      // Update post like count
      await tx.post.update({
        where: {
          id: validatedParams.postId,
        },
        data: {
          likeCount: { increment: 1 },
        },
      });

      return createdLike;
    });

    // Send response success - like
    return res
      .status(201)
      .json({ message: "Like post/feed berhasil.", data: createdLike });
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

export const checkLikeUser = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request params
    const checkLikeUserParamsSchema = z.object({
      postId: z.coerce.number().int().positive("Post ID harus valid."),
    });

    const validatedParams = checkLikeUserParamsSchema.parse(req.params);

    // Check target post
    const postData = await prisma.post.findUnique({
      where: {
        id: validatedParams.postId,
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
          postId: validatedParams.postId,
        },
      },
    });

    // Send response
    return res.status(200).json({
      data: Boolean(existingLike),
    });
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
