import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const toggleSaveFeed = async (req, res) => {
  const currentUserId = req.user.id;
  const { postId } = req.params;

  try {
    // Validation
    const postData = await prisma.post.findUnique({
      where: {
        id: Number(postId),
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan" });
    }

    const checkUserBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: Number(postId),
        },
      },
    });

    if (checkUserBookmark) {
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: Number(postId),
          },
        },
      });

      return res.status(200).json({ message: "Berhasil unsave post" });
    }

    const newBookmark = await prisma.bookmark.create({
      data: {
        userId: currentUserId,
        postId: Number(postId),
      },
    });

    return res.status(200).json({ message: "Berhasil save post", data: newBookmark });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};

export const checkSavedFeed = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { postId } = req.params;

    const checkSaved = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: Number(postId),
        },
      },
    });

    if (checkSaved) {
      return res.status(200).json({ data: true });
    }

    return res.status(200).json({ data: false });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};
