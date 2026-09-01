import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

const main = async () => {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@mail.com",
    },
    update: {
      role: "ADMIN",
    },
    create: {
      fullname: "Administrator",
      email: "admin@mail.com",
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin account created successfully.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
