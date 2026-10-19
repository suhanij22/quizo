import express, { Router } from "express";
import { loginUser, registerUser } from "../controllers/userAuthenticate.js";

const authRouter:Router= Router();

authRouter.post("/register",registerUser);
authRouter.post("/login",loginUser);

export default authRouter;