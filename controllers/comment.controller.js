import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const createComment = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { postId, content } = req.body;

    // Validation 1
    if (!postId || !content) {
      return res.status(400).json({ message: "Inputan post dan content wajib diisi" });
    }

    // Validation 2
    const postData = await prisma.post.findUnique({
      where: {
        id: Number(postId),
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post/feed tidak ditemukan" });
    }

    // Insert Data
    const newComment = await prisma.comment.create({
      data: {
        userId: Number(currentUserId),
        postId: Number(postId),
        content,
      },
    });

    // Update Post Count
    await prisma.post.update({
      where: {
        id: Number(postId),
      },
      data: {
        commentCount: { increment: 1 },
      },
    });

    return res.status(201).json({ message: "Comment berhasil", data: newComment });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server Down",
      error: err,
    });
  }
};

export const deleteCommentById = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  const comment = await prisma.comment.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.userId != Number(currentUserId)) {
    return res.status(400).json({ message: "Anda tidak bisa menghapus komentar user lain" });
  }

  await prisma.comment.delete({
    where: {
      id: Number(id),
    },
  });

  await prisma.post.update({
    where: {
      id: Number(comment.postId),
    },
    data: {
      commentCount: { decrement: 1 },
    },
  });

  return res.status(200).json({ message: "Delete Comment Berhasil" });
};
