import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export const AuthMiddleware = async (req, res, next) => {
  const jwtSecret = process.env.JWT_SECRET;

  try {
    const headers = req.headers.authorization;

    if (!headers) {
      return res.status(401).json({
        message: "Authorization error, token belum diinput",
      });
    }

    const token = headers.split("Bearer ")[1];
    const decoded = jwt.verify(token, jwtSecret);

    const currentUser = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!currentUser) {
      return res.status(401).json({
        message: "User tidak ditemukan",
      });
    }

    // menambah user ke req
    req.user = {
      id: currentUser.id,
      fullname: currentUser.fullname,
      username: currentUser.username,
      email: currentUser.email,
      image: currentUser.image,
      bio: currentUser.bio,
    };

    next();
  } catch (err) {
    res.status(500).json({
      message: "Server Down",
    });
  }
};
