import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import cloudinary from "../lib/cloudinary.js";

export const getUserByUsername = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username,
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
      return res.status(404).json({ message: "Username tidak ditemukan" });
    }

    return res.status(200).json({ message: "Detail User", data: user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Down", error: err });
  }
};

export const getSearchUser = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res
      .status(404)
      .json({ message: "Parameter query username belum diisi" });
  }

  const users = await prisma.user.findMany({
    where: {
      username: {
        contains: username,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      username: true,
      fullname: true,
      image: true,
    },
  });

  if (users.length === 0) {
    return res.status(404).json({ message: "Username tidak ditemukan" });
  }

  return res.status(200).json({ message: "Search User", data: users });
};

export const updateUser = async (req, res) => {
  try {
    // Validation dengan Zod
    const userSchema = z.object({
      fullname: z.string().min(6, "Fullname minimal 6 karakter"),
      username: z.string().min(6, "Username minimal 6 karakter"),
      bio: z.string().min(10, "Biodata minimal 10 karakter"),
    });

    const validated = userSchema.parse(req.body);

    // Validation untuk username
    const currentUser = await prisma.user.findUnique({
      where: {
        username: validated.username,
      },
    });

    if (currentUser && currentUser.id !== req.user.id) {
      return res.status(400).json({
        message: "Username sudah digunakan, silahkan gunakan username lain",
      });
    }

    // Update User berdasarkan req user id
    const updateUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        bio: validated.bio,
        username: validated.username,
        fullname: validated.fullname,
      },
      omit: {
        password: true,
      },
    });

    // Success Response
    return res
      .status(200)
      .json({ message: "Update User Berhasil", data: updateUser });
  } catch (err) {
    if (err instanceof Error && "issues" in err) {
      // zod
      const errors = err.issues.map((i) => i.message);
      return res.status(400).json({ message: errors });
    }

    // express
    console.log(err);
    return res.status(500).json({ message: "Server Down" });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    // Validation file
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Belum ada gambar yang diinputkan" });
    }

    // Get current user dari req user id
    const currentUser = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    // Validation 2 - Kita buat fungsi untuk hapus gambar lama
    if (currentUser.imageId) {
      await cloudinary.uploader.destroy(currentUser.imageId);
    }

    // Upload gambar dengan buffer multer
    const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(fileStr, {
      folder: "medsos/avatar",
      transformation: [
        {
          width: 300,
          height: 300,
        },
      ],
    });

    // Update user image dan image id di database table user
    const updateUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        image: result.secure_url,
        imageId: result.public_id,
      },
      omit: {
        password: true,
      },
    });

    // Res success
    return res
      .status(200)
      .json({ message: "Update Photo Profile Berhasil", data: updateUser });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Server Down",
      error: err,
    });
  }
};
