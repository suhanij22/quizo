import express from "express";
import authRouter from "./routes/userAuth";
import quizRouter from "./routes/quizRoute";

const app= express();
app.use(express.json());

app.use("/user",authRouter);
app.use("/quiz",quizRouter);

app.listen(3001,()=>{
    console.log("listennig to port 3001");
})