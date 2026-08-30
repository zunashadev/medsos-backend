import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const followUserAccount = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request params
    const followUserAccountParamsSchema = z.object({
      userId: z.coerce.number().int().positive("User ID harus valid."),
    });

    const validatedParams = followUserAccountParamsSchema.parse(req.params);

    // Check if current user follows themselves
    if (currentUserId === validatedParams.userId) {
      return res
        .status(400)
        .json({ message: "Tidak bisa follow akun sendiri." });
    }

    // Check target user
    const targetUser = await prisma.user.findUnique({
      where: {
        id: validatedParams.userId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    // Check existing follow
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: validatedParams.userId,
        },
      },
    });

    if (existingFollow) {
      return res.status(409).json({ message: "User sudah di-follow." });
    }

    // Follow Transaction
    const createdFollow = await prisma.$transaction(async (tx) => {
      // Create follow
      const createdFollow = await tx.follow.create({
        data: {
          followerId: currentUserId,
          followingId: validatedParams.userId,
        },
      });

      // Update current user's following count
      await tx.user.update({
        where: {
          id: currentUserId,
        },
        data: {
          followingCount: {
            increment: 1,
          },
        },
      });

      // Update target user's follower count
      await tx.user.update({
        where: {
          id: validatedParams.userId,
        },
        data: {
          followerCount: {
            increment: 1,
          },
        },
      });

      return createdFollow;
    });

    // Send response success
    return res
      .status(201)
      .json({ message: "Follow user berhasil.", data: createdFollow });
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

export const unfollowUserAccount = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request params
    const unfollowUserAccountParamsSchema = z.object({
      userId: z.coerce.number().int().positive("User ID harus valid."),
    });

    const validatedParams = unfollowUserAccountParamsSchema.parse(req.params);

    // Check target user
    const targetUser = await prisma.user.findUnique({
      where: {
        id: validatedParams.userId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        message: "User tidak ditemukan.",
      });
    }

    // Check existing follow
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: validatedParams.userId,
        },
      },
    });

    if (!existingFollow) {
      return res.status(409).json({
        message: "User belum di-follow.",
      });
    }

    // Unfollow Transaction
    await prisma.$transaction(async (tx) => {
      // Delete follow
      await tx.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: validatedParams.userId,
          },
        },
      });

      // Update current user's following count
      await tx.user.update({
        where: {
          id: currentUserId,
        },
        data: {
          followingCount: {
            decrement: 1,
          },
        },
      });

      // Update target user's follower count
      await tx.user.update({
        where: {
          id: validatedParams.userId,
        },
        data: {
          followerCount: {
            decrement: 1,
          },
        },
      });
    });

    // Send response success
    return res.status(200).json({ message: "User berhasil di-unfollow" });
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

export const getSuggestedUsers = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get list of followed user IDs
    const followedUsers = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followedUserIds = followedUsers.map((follow) => follow.followingId);

    // Fetch recommended users (exclude current user and already followed)
    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [...followedUserIds, currentUserId],
        },
      },
      select: {
        id: true,
        image: true,
        fullname: true,
        username: true,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Send response success
    return res.status(200).json({
      message: `${suggestedUsers.length} user yang belum di-follow.`,
      data: suggestedUsers,
    });
  } catch (err) {
    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const isFollowUser = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request params
    const isFollowUserParamsSchema = z.object({
      userId: z.coerce.number().int().positive("User ID harus valid."),
    });

    const validatedParams = isFollowUserParamsSchema.parse(req.params);

    // Check target user
    const targetUser = await prisma.user.findUnique({
      where: {
        id: validatedParams.userId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    // Check follow status
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: validatedParams.userId,
        },
      },
    });

    // Send response
    return res.status(200).json({
      data: Boolean(existingFollow),
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
