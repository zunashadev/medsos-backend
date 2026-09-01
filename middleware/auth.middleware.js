import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export const AuthMiddleware = async (req, res, next) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured.");
    return res.status(500).json({ message: "Internal server error." });
  }

  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res
        .status(401)
        .json({ message: "Authorization header is required." });
    }

    // Pastikan formatnya: Bearer <token>
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid authorization format." });
    }

    // Verifikasi JWT
    const decoded = jwt.verify(token, jwtSecret);

    // Pastikan payload memiliki ID user
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.id !== "number"
    ) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Cari user berdasarkan ID dari token
    const currentUser = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        role: true,
        image: true,
        bio: true,
      },
    });

    if (!currentUser) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    // Menambah user ke req
    req.user = currentUser;

    return next();
  } catch (err) {
    // JWT invalid
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: "Invalid or expired token.",
      });
    }

    // Error lainnya
    console.error("Auth middleware error:", err);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
