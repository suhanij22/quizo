import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { createQuiz ,createQuestion,getQuiz,getMyQuizzes} from "../controllers/quizController";

const quizRouter:Router=Router();

quizRouter.post("/create",authMiddleware,createQuiz);
quizRouter.post("/:quizId/questions",authMiddleware,createQuestion);
quizRouter.get("/:quizId",getQuiz);
quizRouter.get("/user/myQuizzes",authMiddleware,getMyQuizzes);
export default quizRouter;