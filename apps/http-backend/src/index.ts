import express from "express";
import authRouter from "./routes/userAuth";

const app= express();
app.use(express.json());

app.use("/user",authRouter);

app.listen(3001,()=>{
    console.log("listennig to port 3001");
})