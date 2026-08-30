import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";

export const getUserByUsername = async (req, res) => {
  try {
    // Validate request params
    const getUserByUsernameParamsSchema = z.object({
      username: z
        .string()
        .trim()
        .min(6, "Username minimal 6 karakter.")
        .max(30, "Username maksimal 30 karakter."),
    });

    const validatedParams = getUserByUsernameParamsSchema.parse(req.params);

    // Get user data
    const user = await prisma.user.findUnique({
      where: {
        username: validatedParams.username,
      },
      omit: {
        password: true,
        imageId: true,
      },
      include: {
        posts: {
          omit: {
            userId: true,
            imageId: true,
          },
        },
        bookmarks: {
          include: {
            post: {
              omit: {
                userId: true,
                imageId: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Username tidak ditemukan." });
    }

    // Send response success
    return res.status(200).json({ message: "Detail User.", data: user });
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

export const getSearchUser = async (req, res) => {
  try {
    // Validate request query
    const getSearchUserQuerySchema = z.object({
      username: z.string().trim().min(1, "Username harus diisi."),
    });

    const validatedQuery = getSearchUserQuerySchema.parse(req.query);

    // Search users
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: validatedQuery.username,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        image: true,
      },
      orderBy: {
        username: "asc",
      },
      take: 20,
    });

    if (users.length === 0) {
      return res.status(404).json({ message: "Username tidak ditemukan." });
    }

    // Send success response
    return res.status(200).json({ message: "Search user.", data: users });
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

export const updateUser = async (req, res) => {
  try {
    // Get current user ID
    const currentUserId = req.user.id;

    // Validate request body
    const updateUserBodySchema = z.object({
      fullname: z
        .string()
        .trim()
        .min(6, "Fullname minimal 6 karakter.")
        .max(100, "Fullname maksimal 100 karakter."),
      username: z
        .string()
        .trim()
        .min(6, "Username minimal 6 karakter.")
        .max(30, "Username maksimal 30 karakter."),
      bio: z
        .string()
        .trim()
        .min(10, "Biodata minimal 10 karakter.")
        .max(500, "Biodata maksimal 500 karakter."),
    });

    const validatedBody = updateUserBodySchema.parse(req.body);

    // Check username availability
    const existingUserByUsername = await prisma.user.findUnique({
      where: {
        username: validatedBody.username,
      },
    });

    if (existingUserByUsername && existingUserByUsername.id !== currentUserId) {
      return res.status(409).json({
        message: "Username sudah digunakan, silahkan gunakan username lain.",
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: currentUserId,
      },
      data: {
        bio: validatedBody.bio,
        username: validatedBody.username,
        fullname: validatedBody.fullname,
      },
      omit: {
        password: true,
      },
    });

    // Send success response
    return res.status(200).json({
      message: "Update user berhasil.",
      data: updatedUser,
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

export const updateAvatar = async (req, res) => {
  let uploadedImage = null;

  try {
    // Validate uploaded file
    if (!req.file) {
      return res.status(400).json({ message: "File gambar wajib diinput." });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    // Upload new avatar to Cloudinary
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    uploadedImage = await cloudinary.uploader.upload(fileStr, {
      folder: "medsos/avatar",
      transformation: [
        {
          width: 300,
          height: 300,
        },
      ],
    });

    // Update user avatar in database
    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        image: uploadedImage.secure_url,
        imageId: uploadedImage.public_id,
      },
      omit: {
        password: true,
      },
    });

    // Delete old avatar from Cloudinary
    if (currentUser.imageId) {
      try {
        await cloudinary.uploader.destroy(currentUser.imageId);
      } catch (cloudinaryError) {
        console.error(
          "Failed to delete old avatar from Cloudinary:",
          cloudinaryError,
        );
      }
    }

    // Send success response
    return res
      .status(200)
      .json({ message: "Update photo profile berhasil.", data: updatedUser });
  } catch (err) {
    // Rollback uploaded image if database update fails
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cloudinaryError) {
        console.error("Failed to rollback uploaded avatar:", cloudinaryError);
      }
    }

    // Unexpected error
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
