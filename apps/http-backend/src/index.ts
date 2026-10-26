import express from "express";
import authRouter from "./routes/userAuth";
import quizRouter from "./routes/quizRoute";
import sessionRouter from "./routes/sessionRoute";
import cors from "cors";

const app= express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000",
}));

app.use("/",authRouter);
app.use("/quiz",quizRouter);
app.use ("/session",sessionRouter);

app.listen(3001,()=>{
    console.log("listennig to port 3001");
})