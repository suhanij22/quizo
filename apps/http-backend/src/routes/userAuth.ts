import express, { Router } from "express";
import { loginUser, registerUser } from "../controllers/userAuthenticate.js";

const router:Router= Router();

router.post("/register",registerUser);
router.post("/login",loginUser);

export default router;