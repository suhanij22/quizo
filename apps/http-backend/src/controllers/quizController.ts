import { prismaClient } from "@repo/db/client";
import { Response,Request } from "express"

export const createQuiz= async(req:Request,res:Response)=>{
    try{
        const {title,description }=req.body;
        if(!title)
        {
            return res.status(400).json({
                message:"title not found"
            });
        }
        if (!req.userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const quiz= await prismaClient.quiz.create({
            data:{
                title,
                description,
                creator:{
                    connect:{
                        id:req.userId
                    }
                }
            }
        });

        return res.status(200).json({
            message:"quiz created successfully",
            quiz
        });
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            err,
            message:"internal server error"
        });
    }
};

export const createQuestion=async(req:Request,res:Response)=>{
    try{
        const {quizId}= req.params;
        const {text,timeLimit=15,options,difficulty="EASY"}=req.body;
        if (!req.userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        if(!text||!timeLimit||!options)
        {
            return res.status(400).json({
                message:"data not present"
            });
        }

        const totalQuestions= await prismaClient.question.count({
            where:{
                quizId:quizId as string
            }
        });

        const quiz = await prismaClient.quiz.findFirst({
            where: {
                id: quizId as string,
                creatorId: req.userId
            }
        });

        if (!quiz) {
            return res.status(404).json({
                message: "Quiz not found"
            });
        }

        const question= await prismaClient.question.create({
            data:{
                text,
                timeLimit,
                order:totalQuestions+1,
                difficulty,
                quiz:{connect:{id:quiz.id}},
                options:{
                    create:options.map((option:any)=>({
                        text:option.text,
                        isCorrect:option.isCorrect??false
                    }))
                }
            },
            include:{
                options:true
            }
        });

        return res.status(200).json({
            message:"question created",
            question
        });
    }
    catch(err){
        res.status(500).json({
            message:"internal server error"
        });
    }
};

export const getQuiz= async (req:Request,res:Response)=>{
    try{
        const {quizId}=req.params;

        const quiz=await prismaClient.quiz.findUnique({
            where:{
                id:quizId as string,
            },
            include:{
                questions:{
                    include:{options:true},
                    orderBy:{order:'asc'}
                }
            }
        });

        if(!quiz)
        {
            return res.status(404).json({
                message:"quiz not found"
            });
        }

        return res.status(200).json({
            quiz
        });
    }
    catch(err)
    {
        res.status(500).json({
            message:"internal server error"
        });
    }
};
