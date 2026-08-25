import * as z from "zod";
import cloudinary from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

export const createFeed = async (req, res) => {
  let uploadedImage = null;

  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get body request
    const { caption } = req.body;

    // Validate request body
    const bodySchema = z.object({
      caption: z
        .string()
        .trim()
        .min(1, "Caption wajib diisi.")
        .max(500, "Caption maksimal 500 karakter."),
    });

    const validated = bodySchema.parse({ caption });

    // Validate upload file
    if (!req.file) {
      return res.status(400).json({ message: "File gambar belum diinput." });
    }

    // Upload image to Cloudinary
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    uploadedImage = await cloudinary.uploader.upload(fileStr, {
      folder: "medsos/feed",
      transformation: [
        {
          aspect_ratio: "4:5",
          crop: "fill",
          gravity: "auto",
        },
        {
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });

    // Create post and update user's post count
    const newFeed = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          caption: validated.caption,
          image: uploadedImage.secure_url,
          imageId: uploadedImage.public_id,
          userId: currentUserId,
        },
      });

      // Update data user
      await tx.user.update({
        where: {
          id: currentUserId,
        },
        data: {
          postCount: { increment: 1 },
        },
      });

      return post;
    });

    return res
      .status(201)
      .json({ message: "Feed berhasil dibuat.", data: newFeed });
  } catch (err) {
    // Zod error
    if (err instanceof z.ZodError) {
      const errors = err.issues.map((i) => i.message);
      return res.status(400).json({ message: errors });
    }

    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cloudinaryError) {
        console.error("Failed to rollback Cloudinary upload:", cloudinaryError);
      }
    }

    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const readAllFeed = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get query params
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 3;

    // Validate pagination
    const paginationSchema = z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive().max(50),
    });

    const validated = paginationSchema.parse({
      page,
      limit,
    });

    // Get users that current user follows
    const followings = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = followings.map((f) => f.followingId);

    // Calculate pagination
    const skip = (validated.page - 1) * validated.limit;

    // Get total feed count
    const totalFeed = await prisma.post.count({
      where: { userId: { in: [...followingIds, currentUserId] } },
    });

    // Get post
    const posts = await prisma.post.findMany({
      where: {
        userId: { in: [...followingIds, currentUserId] },
      },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: validated.limit,
    });

    // Calculate total pages
    const totalPage = Math.ceil(totalFeed / validated.limit);

    return res.status(200).json({
      message: "Get all posts.",
      page: validated.page,
      limit: validated.limit,
      totalPage,
      totalFeed,
      data: posts,
    });
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

export const detailFeed = async (req, res) => {
  try {
    // Get post ID
    const postId = Number(req.params.id);

    // Get post detail
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            username: true,
            image: true,
          },
        },
        comments: {
          select: {
            content: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                fullname: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post tidak ditemukan." });
    }

    return res.status(200).json({ message: "Get detail feed.", data: post });
  } catch (err) {
    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteFeed = async (req, res) => {
  try {
    // Get post ID
    const postId = Number(req.params.id);

    // Get post data
    const postData = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post tidak ditemukan." });
    }

    // Check post Ownership
    if (postData.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Anda tidak bisa menghapus feed user lain." });
    }

    // Delete post and update user's post count
    await prisma.$transaction(async (tx) => {
      await tx.post.delete({
        where: {
          id: postData.id,
        },
      });

      await tx.user.update({
        where: {
          id: postData.userId,
        },
        data: {
          postCount: {
            decrement: 1,
          },
        },
      });
    });

    // Delete image from Cloudinary
    if (postData.imageId) {
      try {
        await cloudinary.uploader.destroy(postData.imageId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete image from Cloudinary:",
          cloudinaryError,
        );
      }
    }

    return res.status(200).json({ message: "Post berhasil dihapus." });
  } catch (err) {
    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
