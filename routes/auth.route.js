import express from "express";
import { GetUser, LoginUser, RegisterUser } from "../controllers/auth.controller.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const AuthRouter = express.Router();

AuthRouter.post("/register", RegisterUser);
AuthRouter.post("/login", LoginUser);
AuthRouter.get("/me", AuthMiddleware, GetUser);

export default AuthRouter;
