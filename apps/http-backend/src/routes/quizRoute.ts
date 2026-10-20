import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { createQuiz ,createQuestion,getQuiz} from "../controllers/quizController";

const quizRouter:Router=Router();

quizRouter.post("/create",authMiddleware,createQuiz);
quizRouter.post("/:quizId/questions",authMiddleware,createQuestion);
quizRouter.get("/:quizId",getQuiz);

export default quizRouter;