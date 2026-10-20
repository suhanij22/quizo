import { prismaClient } from "@repo/db/client";
import { Request,Response } from "express"
import { randomInt } from "node:crypto";

export const createSession= async (req:Request,res:Response)=>{
    try{
        const {quizId}= req.body;
        const quiz= await prismaClient.quiz.findUnique({
            where:{
                id:quizId as string
            },
            include:{questions:true}
        });
        if(!quiz)
        {
            return res.status(400).json({
                message:"quiz not found"
            });
        }
        if(!req.userId)
        {
            return res.status(403).json({
                message:"the user is not authorized to create session"
            })
        }

        if(req.userId!=quiz.creatorId)
        {
            return res.status(403).json({
                message:"quizz doesnt belong to this user"
            });
        }

        if(quiz.questions.length<1)
        {
            return res.status(400).json({
                message:"no questions in the quiz"
            });
        }
        
        const generateJoinCode= ()=>randomInt(100000,1000000).toString();
        //the code generated can be produced same two times or more so we use loop to eliminate that case
        for(let i=0;i<5;i++)
        {
            try{
                const session =await prismaClient.quizSession.create({
                    data:{
                        quizId,joinCode:generateJoinCode(),status:"WAITING"
                    }
                });
                return res.status(201).json({
                    sessionId:session.id,
                    joinCode:session.joinCode
                });
            }
            catch(err:any)
            {
                if(err.code!="P2002") throw err; //only retry on duplicate code
            }
        }
        return res.status(500).json({
            message:"couldnt create join code,try again later"
        });
    }
    catch(err)
    {
        res.status(500).json({
            message:"internal server error"
        });
    }
};

export const getSessionByCode= async (req:Request,res:Response)=>{
    try{
        const {joinCode}= req.params;

        const session= await prismaClient.quizSession.findUnique({
            where:{
                joinCode:joinCode as string
            },
            include:{
                quiz:true
            }
        });
        if(!session)
        {
            return res.status(404).json({
                message:"quiz session not there"
            });
        }

        if(session.status!="WAITING")
        {
            return res.status(409).json({
                message:"the session is no longer accepting participants"
            });
        }
        return res.status(200).json({
           session
        });
    }
    catch(err)
    {
        res.status(500).json({
            message:"internal server error"
        });
    }
};