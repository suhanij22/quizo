import {z} from "zod";

export const createQuizSchema= z.object({
    title:z.string().min(3).max(100),
});

export const createQuestionSchema= z.object({
    quizId:z.string().uuid(),
    question:z.string().min(1),
    options:z.array(
        z.object({
            text:z.string().min(1),
            isCorrect:z.boolean(),
        })
    ).min(2),
});

