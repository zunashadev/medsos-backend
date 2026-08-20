import { error } from "console";
import cloudinary from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

export const createFeed = async (req, res) => {
  try {
    const { caption } = req.body;
    const currentUserId = req.user.id;

    // Validation
    if (!caption) {
      return res.status(400).json({ message: "Caption wajib diisi" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File gambar belum diinput" });
    }

    // Upload gambar dengan buffer multer
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(fileStr, {
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

    // Insert data
    const newFeed = await prisma.post.create({
      data: {
        caption,
        image: result.secure_url,
        imageId: result.public_id,
        userId: currentUserId,
      },
    });

    // Update data user
    await prisma.user.update({
      where: {
        id: Number(currentUserId),
      },
      data: {
        postCount: { increment: 1 },
      },
    });

    return res.status(201).json({ message: "Feed berhasil dibuat", data: newFeed });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};

export const readAllFeed = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const followings = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = followings.map((f) => f.followingId);

    // Query Request
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    const totalFeed = await prisma.post.count({
      where: { userId: { in: [...followingIds, currentUserId] } },
    });

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
      take: limit,
    });

    const totalPage = Math.ceil(totalFeed / limit);

    return res.status(200).json({
      message: "Get all posts",
      page,
      limit,
      totalPage,
      totalFeed,
      data: posts,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};

export const detailFeed = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
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
      return res.status(404).json({ message: "Post tidak ditemukan" });
    }

    return res.status(200).json({ message: "Get Detail Feed", data: post });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};

export const deleteFeed = async (req, res) => {
  const { id } = req.params;

  try {
    const postData = await prisma.post.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!postData) {
      return res.status(404).json({ message: "Feed tidak ditemukan" });
    }

    if (postData.userId != req.user.id) {
      return res.status(400).json({ message: "Anda tidak bisa menghapus feed user lain" });
    }

    if (postData.imageId) {
      await cloudinary.uploader.destroy(postData.imageId);
    }

    await prisma.post.delete({
      where: {
        id: Number(id),
      },
    });

    return res.status(200).json({ message: "Data feed berhasil dihapus" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};
