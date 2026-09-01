import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const RegisterUser = async (req, res) => {
  try {
    // Validate request body
    const registerUserBodySchema = z.object({
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
      email: z.email("Email harus berformat email (example@mail.com).").trim(),
      password: z.string().min(8, "Password minimal 8 karakter."),
    });

    const validatedBody = registerUserBodySchema.parse(req.body);

    // Check email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: {
        email: validatedBody.email,
      },
    });

    if (existingUserByEmail) {
      return res.status(409).json({
        message: "Email sudah terdaftar, silahkan gunakan email lain.",
      });
    }

    // Check username already exists
    const existingUserByUsername = await prisma.user.findUnique({
      where: {
        username: validatedBody.username,
      },
    });

    if (existingUserByUsername) {
      return res.status(409).json({
        message: "Username sudah terdaftar, silahkan gunakan username lain.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedBody.password, salt);

    // Create user in database
    const createdUser = await prisma.user.create({
      data: {
        fullname: validatedBody.fullname,
        username: validatedBody.username,
        password: hashedPassword,
        email: validatedBody.email,
      },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET belum dikonfigurasi.");
    }

    const token = jwt.sign({ id: createdUser.id }, jwtSecret, {
      expiresIn: "6d",
    });

    // Send response success
    return res.status(201).json({
      message: "Register berhasil.",
      data: {
        id: createdUser.id,
        fullname: createdUser.fullname,
        username: createdUser.username,
        email: createdUser.email,
        image: createdUser.image,
        bio: createdUser.bio,
      },
      token: token,
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

export const LoginUser = async (req, res) => {
  try {
    // Validate request body
    const loginUserBodySchema = z.object({
      email: z.email("Email harus berformat email (example@mail.com).").trim(),
      password: z.string().min(1, "Password wajib diisi."),
    });

    const validatedBody = loginUserBodySchema.parse(req.body);

    // Check user existence
    const existingUserByEmail = await prisma.user.findUnique({
      where: {
        email: validatedBody.email,
      },
    });

    if (!existingUserByEmail) {
      return res.status(401).json({
        message: "Email belum terdaftar, silahkan register terlebih dahulu.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validatedBody.password,
      existingUserByEmail.password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid user.",
      });
    }

    // Get JWT secret
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) throw new Error("JWT_SECRET belum dikonfigurasi");

    // Generate JWT Token
    const token = jwt.sign({ id: existingUserByEmail.id }, jwtSecret, {
      expiresIn: "6d",
    });

    // Send success response
    return res.status(200).json({
      message: "Login berhasil",
      data: {
        id: existingUserByEmail.id,
        fullname: existingUserByEmail.fullname,
        username: existingUserByEmail.username,
        email: existingUserByEmail.email,
        role: existingUserByEmail.role,
        image: existingUserByEmail.image,
        bio: existingUserByEmail.bio,
      },
      token,
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

export const GetUser = async (req, res) => {
  res.status(200).json({
    message: "Berhasil get user.",
    data: req.user,
  });
};
