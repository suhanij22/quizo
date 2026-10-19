import express, { Router } from "express";
import { getUser, loginUser, registerUser } from "../controllers/userAuthenticate.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const authRouter:Router= Router();

authRouter.post("/register",registerUser);
authRouter.post("/login",loginUser);
authRouter.get("/myId",authMiddleware,getUser);

export default authRouter;