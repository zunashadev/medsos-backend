import * as z from "zod";
import { prisma } from "../lib/prisma.js";

export const followUserAccount = async (req, res) => {
  try {
    // Get Current User ID & Follow User ID
    const currentUserId = req.user.id;
    const followUserId = Number(req.body.followUserId);

    // check jika current user sama dengan followUserId
    if (currentUserId === followUserId) {
      return res
        .status(400)
        .json({ message: "Tidak bisa follow akun sendiri" });
    }

    const otherUserId = await prisma.user.findUnique({
      where: {
        id: followUserId,
      },
    });

    if (!otherUserId) {
      return res.status(404).json({ message: "User id tidak ditemukan" });
    }

    const isFollowUser = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: followUserId,
        },
      },
    });

    if (isFollowUser) {
      return res.status(400).json({ message: "User sudah pernah di follow" });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: followUserId,
      },
    });

    // update user count
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

    await prisma.user.update({
      where: {
        id: followUserId,
      },
      data: {
        followerCount: {
          increment: 1,
        },
      },
    });

    return res
      .status(201)
      .json({ message: "Follow User Berhasil", data: follow });
  } catch (err) {
    console.log(err);

    return res.status(500).json({ message: "Server Down" });
  }
};

export const unfollowUserAccount = async (req, res) => {
  const { unfollowUserId } = req.params;
  const currentUserId = req.user.id;

  const userUnfollow = await prisma.user.findUnique({
    where: {
      id: Number(unfollowUserId),
    },
  });

  if (!userUnfollow) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: Number(currentUserId),
          followingId: Number(unfollowUserId),
        },
      },
    });

    await prisma.user.update({
      where: {
        id: Number(currentUserId),
      },
      data: {
        followingCount: {
          decrement: 1,
        },
      },
    });

    await prisma.user.update({
      where: {
        id: Number(unfollowUserId),
      },
      data: {
        followerCount: {
          decrement: 1,
        },
      },
    });

    return res.status(200).json({ message: "User berhasil di unfollow" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};

export const getLimitUser = async (req, res) => {
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
      message: "5 user yang belum di follow",
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
    const { followUserId } = req.params;

    const checkFollowUserId = await prisma.user.findUnique({
      where: {
        id: Number(followUserId),
      },
    });

    if (!checkFollowUserId) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const isFollowUserData = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: Number(followUserId),
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
