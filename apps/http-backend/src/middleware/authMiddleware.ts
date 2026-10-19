import { JWT_SECRET } from "@repo/backend-common/config";
import { Response,Request,NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware=async (req:Request,res:Response,next:NextFunction)=>{
    try{
        const authHeader= req.headers["authorization"];
        if(!authHeader||!authHeader.startsWith('Bearer '))
        {
            return res.status(401).json({
                message:"you are not authorized"
            });
        }

        const token =authHeader.split(' ')[1];
        if(!token)
        {
            return res.status(401).json({
                message:"you are not authorized"
            });
        }

        const decoded= jwt.verify(token,JWT_SECRET) as {userId:string};
        req.userId=decoded.userId;
        next();
    }
    catch(err)
    {
        res.status(500).json({
            message:"internal server error"
        });
    }
};