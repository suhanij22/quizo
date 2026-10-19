import { Request,Response } from "express";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "@repo/backend-common/config";

export const registerUser=async(req:Request,res:Response)=>{
    try{
        const {email,name,password}= req.body;

        const isUserExist= await prismaClient.user.findUnique({
            where:{email}
        });
        if(!isUserExist)
        {
            return res.status(400).json({
                message:"user already exists"
            });
        }

        const hashPassword= await bcrypt.hash(password,10);
        const user= await prismaClient.user.create({
            data:{
                name,
                password:hashPassword,
                email
            }
        });
        req.userId= user.id;

        const token =jwt.sign({
            userId:user.id,
        },JWT_SECRET,{expiresIn:'30d'});

        return res.status(200).json({
            token,
            user:{
                id:user.id,
                email:user.email,
                name:user.name
            }
        });

    }
    catch(err)
    {
        return res.status(500).json({
            message:"internal server error"
        });
    }
};

export const loginUser= async(req:Request,res:Response)=>{
    try{
        const {email,password}= req.body;
        if(!email||!password)
        {
            return res.status(400).json({
                message:"all fields required"
            });
        }

        const user= await prismaClient.user.findUnique({
            where:{email}
        });
        if(!user)
        {
            return res.status(404).json({
                message:"no user found"
            });
        }

        const passwordMatch=await bcrypt.compare(password,user.password);
        if(!passwordMatch)
        {
            return res.status(400).json({
                message:"invalid credentials"
            });
        }

        req.userId=user.id;

        const token= jwt.sign({
            userId:user.id
        },JWT_SECRET,{expiresIn:'30d'});

        return res.status(200).json({
            token,
            user:{
                id:user.id,
                email:user.email,
                name:user.name
            }
        });
    }
    catch(err){
        res.status(500).json({
            message:"internal server error"
        });
    }
};

