import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const likeFeedUser = async (req, res) => {
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

    // Cek jika user sudah like post tersebut
    const checkLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: Number(postId),
        },
      },
    });

    if (checkLike) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: currentUserId,
            postId: Number(postId),
          },
        },
      });

      await prisma.post.update({
        where: {
          id: Number(postId),
        },
        data: {
          likeCount: { decrement: 1 },
        },
      });

      return res.status(200).json({ message: "Unlike post berhasil" });
    }

    // Insert Data Like
    const newLike = await prisma.like.create({
      data: {
        userId: currentUserId,
        postId: Number(postId),
      },
    });

    // Update Post
    await prisma.post.update({
      where: {
        id: Number(postId),
      },
      data: {
        likeCount: { increment: 1 },
      },
    });

    return res.status(201).json({ message: "Berhasil Like Feed", data: newLike });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};

export const checkLikeUser = async (req, res) => {
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

    const checkLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId: Number(postId),
        },
      },
    });

    if (checkLike) {
      return res.status(200).json({ data: true });
    }

    return res.status(200).json({ data: false });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};
