import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const RegisterUser = async (req, res) => {
  try {
    // Validation Zod
    const userSchema = z.object({
      fullname: z.string().min(6, "Fullname minimal 6 karakter"),
      username: z.string().min(6, "Username minimal 6 karakter"),
      email: z.email("Email harus berformat email (example@mail.com)"),
      password: z.string().min(8, "Password minimal 8 karakter"),
    });

    const validated = userSchema.parse(req.body);

    // cek email & username apakah sudah terdaftar
    const emailExisting = await prisma.user.findUnique({
      where: {
        email: validated.email,
      },
    });

    if (emailExisting) {
      return res.status(400).json({
        message: "Email sudah terdaftar, silahkan gunakan email lain!",
      });
    }

    const usernameExisting = await prisma.user.findUnique({
      where: {
        username: validated.username,
      },
    });

    if (usernameExisting) {
      return res.status(400).json({
        message: "Username sudah terdaftar, silahkan gunakan username lain!",
      });
    }

    // Password Encryption
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(validated.password, salt);

    // Insert Data to Database
    const newUser = await prisma.user.create({
      data: {
        fullname: validated.fullname,
        username: validated.username,
        password: hashedPassword,
        email: validated.email,
      },
    });

    // Buat jwt simpan id user ke jwt
    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign(
      {
        id: newUser.id,
      },
      jwtSecret,
      { expiresIn: "6d" },
    );

    // Res Success
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

export const LoginUser = async (req, res) => {
  try {
    // VALIDATION
    const loginSchema = z.object({
      email: z.email("Email harus berformat email (example@mail.com)."),
      password: z.string().min(1, "Password wajib diisi."),
    });

    const validated = loginSchema.parse(req.body);

    // FIND USER BY EMAIL
    const existingEmail = await prisma.user.findUnique({
      where: {
        email: validated.email,
      },
    });

    if (!existingEmail) {
      return res.status(400).json({
        message: "Email belum terdaftar, silahkan register terlebih dahulu.",
      });
    }

    // COMPARE PASSWORD REQ BODY & DATABASE
    const comparePassword = bcrypt.compareSync(
      validated.password,
      existingEmail.password,
    );

    if (!comparePassword) {
      return res.status(401).json({
        message: "Invalid user.",
      });
    }

    // CREATE JWT TOKEN
    const jwtSecret = process.env.JWT_SECRET;

    const token = jwt.sign(
      {
        id: existingEmail.id,
      },
      jwtSecret,
      { expiresIn: "6d" },
    );

    // SUCCESS RESPONSE
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
    if (err instanceof Error && "issues" in err) {
      const errors = err.issues.map((i) => i.message);

      return res.status(400).json({ message: errors });
    }

    console.log(err);

    return res.status(500).json({ message: "Server down." });
  }
};

export const GetUser = async (req, res) => {
  res.status(200).json({
    message: "Berhasil get user",
    data: req.user,
  });
};
