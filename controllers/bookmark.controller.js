import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const toggleSaveFeed = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get post ID
    const postId = Number(req.params.postId);

    // Validation request params
    const bookmarkSchema = z.object({
      postId: z.number().int().positive(),
    });

    const validated = bookmarkSchema.parse({ postId });

    // Check target post
    const postData = await prisma.post.findUnique({
      where: {
        id: validated.postId,
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
          postId: validated.postId,
        },
      },
    });

    if (existingBookmark) {
      // Unbookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: validated.postId,
          },
        },
      });

      return res.status(200).json({ message: "Berhasil unsave feed/post." });
    }

    // Bookmark
    const newBookmark = await prisma.bookmark.create({
      data: {
        userId: currentUserId,
        postId: validated.postId,
      },
    });

    return res
      .status(200)
      .json({ message: "Berhasil save feed/post.", data: newBookmark });
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

export const checkSavedFeed = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get post ID
    const postId = Number(req.params.postId);

    // Validate request params
    const bookmarkSchema = z.object({
      postId: z.number().int().positive(),
    });

    const validated = bookmarkSchema.parse({ postId });

    // Check target post
    const postData = await prisma.post.findUnique({
      where: {
        id: validated.postId,
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan." });
    }

    // Check bookmark status
    const checkSaved = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: validated.postId,
        },
      },
    });

    // Send response
    if (checkSaved) {
      return res.status(200).json({ data: true });
    }

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
