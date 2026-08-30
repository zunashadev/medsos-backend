import * as z from "zod";
import cloudinary from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

export const createFeed = async (req, res) => {
  let uploadedImage = null;

  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request body
    const createFeedBodySchema = z.object({
      caption: z
        .string()
        .trim()
        .min(1, "Caption wajib diisi.")
        .max(500, "Caption maksimal 500 karakter."),
    });

    const validatedBody = createFeedBodySchema.parse(req.body);

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
    const createdFeed = await prisma.$transaction(async (tx) => {
      const createdFeed = await tx.post.create({
        data: {
          caption: validatedBody.caption,
          image: uploadedImage.secure_url,
          imageId: uploadedImage.public_id,
          userId: currentUserId,
        },
      });

      // Update user's post count
      await tx.user.update({
        where: {
          id: currentUserId,
        },
        data: {
          postCount: { increment: 1 },
        },
      });

      return createdFeed;
    });

    return res
      .status(201)
      .json({ message: "Feed berhasil dibuat.", data: createdFeed });
  } catch (err) {
    // Rollback Cloudinary  upload
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cloudinaryError) {
        console.error("Failed to rollback Cloudinary upload:", cloudinaryError);
      }
    }

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

export const readAllFeed = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request query
    const readAllFeedQuerySchema = z.object({
      page: z.coerce.number().int().positive("Page harus valid.").default(1),
      limit: z.coerce
        .number()
        .int()
        .positive("Limit harus valid.")
        .max(50, "Limit maksimal 50.")
        .default(3),
    });

    const validatedQuery = readAllFeedQuerySchema.parse(req.query);

    // Get users that current user follows
    const followings = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = followings.map((follow) => follow.followingId);

    // Get feed user IDs
    const feedUserIds = [...followingIds, currentUserId];

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Get total feed count
    const totalFeed = await prisma.post.count({
      where: { userId: { in: feedUserIds } },
    });

    // Get posts
    const posts = await prisma.post.findMany({
      where: {
        userId: { in: feedUserIds },
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
      take: validatedQuery.limit,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalFeed / validatedQuery.limit);

    return res.status(200).json({
      message: "Get all posts.",
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalPages,
      totalFeed,
      data: posts,
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

export const detailFeed = async (req, res) => {
  try {
    // Validate request params
    const detailFeedParamsSchema = z.object({
      id: z.coerce.number().int().positive("Post ID harus valid."),
    });

    const validatedParams = detailFeedParamsSchema.parse(req.params);

    // Get post detail
    const post = await prisma.post.findUnique({
      where: { id: validatedParams.id },
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

export const deleteFeed = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request params
    const deleteFeedParamsSchema = z.object({
      id: z.coerce.number().int().positive("Post ID harus valid."),
    });

    const validatedParams = deleteFeedParamsSchema.parse(req.params);

    // Get post data
    const postData = await prisma.post.findUnique({
      where: {
        id: validatedParams.id,
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Post tidak ditemukan." });
    }

    // Check post ownership
    if (postData.userId !== currentUserId) {
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
          id: currentUserId,
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

    // Send response success
    return res.status(200).json({ message: "Post berhasil dihapus." });
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
