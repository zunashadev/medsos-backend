import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const followUserAccount = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get follow user ID
    const followUserId = Number(req.params.userId);

    // Validate request params
    const followSchema = z.object({
      followUserId: z.number().int().positive(),
    });

    const validated = followSchema.parse({ followUserId });

    // Check if current user follows themselves
    if (currentUserId === validated.followUserId) {
      return res
        .status(400)
        .json({ message: "Tidak bisa follow akun sendiri." });
    }

    // Check target user
    const targetUser = await prisma.user.findUnique({
      where: {
        id: validated.followUserId,
      },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    // Check existing folow
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: validated.followUserId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({ message: "User sudah pernah di-follow." });
    }

    // Follow Transaction
    const follow = await prisma.$transaction(async (tx) => {
      // Create follow
      const follow = await tx.follow.create({
        data: {
          followerId: currentUserId,
          followingId: validated.followUserId,
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
          id: validated.followUserId,
        },
        data: {
          followerCount: {
            increment: 1,
          },
        },
      });

      return follow;
    });

    // Send response success
    return res
      .status(201)
      .json({ message: "Follow user berhasil.", data: follow });
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

export const unfollowUserAccount = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Get unfollow user ID
    const unfollowUserId = Number(req.params.userId);

    // Validate request params
    const unfollowSchema = z.object({
      unfollowUserId: z.number().int().positive(),
    });

    const validated = unfollowSchema.parse({ unfollowUserId });

    // Check target user
    const targetUser = await prisma.user.findUnique({
      where: {
        id: validated.unfollowUserId,
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
          followingId: validated.unfollowUserId,
        },
      },
    });

    if (!existingFollow) {
      return res.status(400).json({
        message: "User belum di-follow.",
      });
    }

    // Delete Transaction
    await prisma.$transaction(async (tx) => {
      // Delete follow
      await tx.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: validated.unfollowUserId,
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
          id: validated.unfollowUserId,
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
      const errors = err.issues.map((i) => i.message);
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
    const followedUser = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followedIds = followedUser.map((f) => f.followingId);

    // Fetch recommended users (exclude current user and already followed)
    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: [...followedIds, currentUserId],
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
      message: `${users.length} user yang belum di-follow`,
      data: users,
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

    // Get target user ID
    const targetUserId = Number(req.params.userId);

    // Check target user
    const checkFollowUserId = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
    });

    if (!checkFollowUserId) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    // Check follow status
    const isFollowUserData = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    // Send response
    if (isFollowUserData) {
      return res.status(200).json({ data: true });
    }

    return res.status(200).json({ data: false });
  } catch (err) {
    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
