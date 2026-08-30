import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const toggleSaveFeed = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request params
    const toggleSaveFeedParamsSchema = z.object({
      postId: z.coerce.number().int().positive("Post ID harus valid."),
    });

    const validatedParams = toggleSaveFeedParamsSchema.parse(req.params);

    // Check target post
    const postData = await prisma.post.findUnique({
      where: {
        id: validatedParams.postId,
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan." });
    }

    // Check existing bookmark
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: validatedParams.postId,
        },
      },
    });

    if (existingBookmark) {
      // Unbookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: validatedParams.postId,
          },
        },
      });

      return res.status(200).json({ message: "Berhasil unsave feed/post." });
    }

    // Bookmark
    const createdBookmark = await prisma.bookmark.create({
      data: {
        userId: currentUserId,
        postId: validatedParams.postId,
      },
    });

    return res
      .status(200)
      .json({ message: "Berhasil save feed/post.", data: createdBookmark });
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

export const checkSavedFeed = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request params
    const checkSavedFeedParamsSchema = z.object({
      postId: z.coerce.number().int().positive("Post ID harus valid."),
    });

    const validatedParams = checkSavedFeedParamsSchema.parse(req.params);

    // Check target post
    const postData = await prisma.post.findUnique({
      where: {
        id: validatedParams.postId,
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan." });
    }

    // Check bookmark status
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: validatedParams.postId,
        },
      },
    });

    // Send response
    return res.status(200).json({
      data: Boolean(existingBookmark),
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
