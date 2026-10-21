import {z} from "zod";
export { ClientMessage } from "./messages.js";

export const CreateUserSchema=z.object({
    username:z.string().min(3).max(20),
    password:z.string(),
    name:z.string()
})

export const LoginSchema= z.object({
    username:z.string().min(3).max(20),
    password:z.string(),
})