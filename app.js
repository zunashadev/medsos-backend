// INI DIGUNAKAN UNTUK PRODUCTION -> VERCEL

import express from "express";
import "dotenv/config";
import cors from "cors";

import { apiReference } from "@scalar/express-api-reference";
import openapiSpecification from "./docs/openapi.js";

import AuthRouter from "./routes/auth.route.js";
import UserRouter from "./routes/user.route.js";
import FollowRouter from "./routes/follow.route.js";
import FeedRouter from "./routes/feed.route.js";
import CommentRouter from "./routes/comment.route.js";
import LikeRouter from "./routes/like.route.js";
import BookmarkRouter from "./routes/bookmark.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/follow", FollowRouter);
app.use("/api/feed", FeedRouter);
app.use("/api/comment", CommentRouter);
app.use("/api/like", LikeRouter);
app.use("/api/bookmark", BookmarkRouter);

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification));

app.use(
  "/api-docs",
  apiReference({
    spec: {
      content: openapiSpecification,
    },
  }),
);

app.get("/", (req, res) => {
  res.json({
    message: "Backend is running",
  });
});

export default app;
