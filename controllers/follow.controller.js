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

    // Create follow
    const follow = await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: validated.followUserId,
      },
    });

    // Update current user's following count
    await prisma.user.update({
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
    await prisma.user.update({
      where: {
        id: validated.followUserId,
      },
      data: {
        followerCount: {
          increment: 1,
        },
      },
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

    // Delete follow
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: validated.unfollowUserId,
        },
      },
    });

    // Update current user's following count
    await prisma.user.update({
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
    await prisma.user.update({
      where: {
        id: validated.unfollowUserId,
      },
      data: {
        followerCount: {
          decrement: 1,
        },
      },
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
    const currentUserId = req.user.id;

    const followedUser = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followedIds = followedUser.map((f) => f.followingId);

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

    return res.status(200).json({
      message: `${users.length} user yang belum di-follow`,
      data: users,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};

export const isFollowUser = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    const checkFollowUserId = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });

    if (!checkFollowUserId) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const isFollowUserData = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: Number(userId),
        },
      },
    });

    if (isFollowUserData) {
      return res.status(200).json({ data: true });
    }

    return res.status(200).json({ data: false });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};
