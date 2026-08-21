import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const RegisterUser = async (req, res) => {
  try {
    // Validate request body
    const userSchema = z.object({
      fullname: z.string().min(6, "Fullname minimal 6 karakter"),
      username: z.string().min(6, "Username minimal 6 karakter"),
      email: z.email("Email harus berformat email (example@mail.com)"),
      password: z.string().min(8, "Password minimal 8 karakter"),
    });

    const validated = userSchema.parse(req.body);

    // Check email already exists
    const emailExisting = await prisma.user.findUnique({
      where: {
        email: validated.email,
      },
    });

    if (emailExisting) {
      return res.status(400).json({
        message: "Email sudah terdaftar, silahkan gunakan email lain.",
      });
    }

    // Check username already exists
    const usernameExisting = await prisma.user.findUnique({
      where: {
        username: validated.username,
      },
    });

    if (usernameExisting) {
      return res.status(400).json({
        message: "Username sudah terdaftar, silahkan gunakan username lain.",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        fullname: validated.fullname,
        username: validated.username,
        password: hashedPassword,
        email: validated.email,
      },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) throw new Error("JWT_SECRET belum dikonfigurasi");

    const token = jwt.sign({ id: newUser.id }, jwtSecret, { expiresIn: "6d" });

    // Send response success
    return res.status(201).json({
      message: "Register berhasil",
      data: {
        id: newUser.id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        image: newUser.image,
        bio: newUser.bio,
      },
      token: token,
    });
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

export const LoginUser = async (req, res) => {
  try {
    // Validate request body
    const loginSchema = z.object({
      email: z.email("Email harus berformat email (example@mail.com)."),
      password: z.string().min(1, "Password wajib diisi."),
    });

    const validated = loginSchema.parse(req.body);

    // Check user existence
    const existingEmail = await prisma.user.findUnique({
      where: {
        email: validated.email,
      },
    });

    if (!existingEmail) {
      return res.status(401).json({
        message: "Email belum terdaftar, silahkan register terlebih dahulu.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      validated.password,
      existingEmail.password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid user.",
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) throw new Error("JWT_SECRET belum dikonfigurasi");

    const token = jwt.sign({ id: existingEmail.id }, jwtSecret, {
      expiresIn: "6d",
    });

    // Send response success
    return res.status(200).json({
      message: "Login berhasil",
      data: {
        id: existingEmail.id,
        fullname: existingEmail.fullname,
        username: existingEmail.username,
        email: existingEmail.email,
        image: existingEmail.image,
        bio: existingEmail.bio,
      },
      token: token,
    });
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

export const GetUser = async (req, res) => {
  res.status(200).json({
    message: "Berhasil get user",
    data: req.user,
  });
};
