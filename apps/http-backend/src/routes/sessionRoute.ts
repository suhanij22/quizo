import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getSessionByCode,createSession } from "../controllers/sessionController";
const sessionRouter:Router=Router();

sessionRouter.post("/create",authMiddleware,createSession);
sessionRouter.get("/:joinCode",getSessionByCode);

export default sessionRouter;