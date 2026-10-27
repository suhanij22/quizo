
import jwt from "jsonwebtoken";
import { prismaClient } from "@repo/db/client";
import {JWT_SECRET} from "@repo/backend-common/config";
import { WebSocketServer, WebSocket } from "ws";
import { ClientMessage } from "@repo/common";

type Option={
    id:string,
    text:string,
    isCorrect:boolean
};

type QuestionData={
    id:string,
    text:string,
    timeTaken:number,
    options:Option[]
};

type Player={
    id:string,
    username:string,
    socket:WebSocket|null,
    score:number
};

type AnswerResult={
    optionId:string,
    isCorrect:boolean,
    points:number
};

type Room={
    joinCode:string,
    sessionId:string,
    quizId:string,
    hostId:string//user id of the quiz owner
    hostSocket:WebSocket|null,
    status:"WAITING"|"IN_PROGRESS"|"FINISHED",
    players:Map<string,Player>,  //playerId-->player
    questions :QuestionData[], //loaded when the quiz starts
    currentIndex:number,
    questionActive:boolean //true while player can still answer
    questionStartedAt:number //when the question begins
    answers:Map<string,AnswerResult> //playerId-->answer for current question
    timer:NodeJS.Timeout|null
};

//who is this socket ?(one per connection)
type Ctx={
    current:
        |{role:"host",joinCode:string}
        |{role:"player",joinCode:string,playerId:string}
        |null;
    joining:boolean 
};

type Msg<T extends ClientMessage["type"]>=Extract<ClientMessage,{type:T}>;

const PAUSE_MS= 5000;//5sec pause between questions showing for showing answers+leaderboard
const MAX_POINTS=1000;//points for an instant corret answer

//joinCode -->room. this is live notebook for all runnig gamess
const rooms=new Map<string,Room>();

const err= (message:string)=>({
    type:"error",
    message
});

function send(socket:WebSocket|null ,data:object){
    if(socket&&socket.readyState===WebSocket.OPEN)
    {
        socket.send(JSON.stringify(data));
    }
}

//send to every player and the host (expect that player joining)
function broadcast(room:Room,data:object,exceptPlayerId?:string)
{
    send(room.hostSocket,data);
    for(const p of room.players.values()){
        if(p.id!==exceptPlayerId) send(p.socket,data);
    }
}

function usernames(room:Room){
    return [...room.players.values()].map(p=>p.username);
}

function leaderboard(room:Room)
{
    return [...room.players.values()].sort((a,b)=>b.score-a.score).map((p)=>({playerId:p.id,username:p.username,score:p.score}))
}

//true when every player that is connected has answered
function allConnectionsAnswered(room:Room)
{
    const connected= [...room.players.values()].filter((p)=>p.socket);
    return connected.length>0&&connected.every((p)=>room.answers.has(p.id));
}

//find or create the in-memory room for join code
async function getOrCreateRoom(joinCode:string):Promise<Room|null>{
    const existing=rooms.get(joinCode);
    if(existing) return existing;

    //not in memory yet -->check database
    const session= await prismaClient.quizSession.findUnique({
        where:{joinCode},
        include:{quiz:{select:{creatorId:true}}}
    });
    if(!session||session.status!=="WAITING")
    {
        return null;
    }

    //someone else may have created a room while we were waiting in the database
    const again= rooms.get(joinCode);
    if(again) return again;

    const room:Room={
        joinCode,
        sessionId:session.id,
        quizId:session.quizId,
        hostId:session.quiz.creatorId,
        hostSocket:null,
        status:"WAITING",
        players:new Map(),
        questions:[],
        currentIndex:-1,
        questionActive:false,
        questionStartedAt:0,
        answers:new Map(),
        timer:null,
    };
    rooms.set(joinCode,room);
    return room;
}

//if nobody is connected then free the memory
function cleanIfEmpty(room:Room){
    const someoneHere= room.hostSocket||[...room.players.values()].some(p=>p.socket);
    if(someoneHere) return;

    if(room.timer) clearTimeout(room.timer);
    rooms.delete(room.joinCode);

    // a game that was running and got abandoned is cancelled
  // (a room still WAITING is simply recreated from the
    if(room.status==="IN_PROGRESS")
        {
            prismaClient.quizSession.update({where:{id:room.sessionId},data:{status:"CANCELLED"}})
            .catch(e=>console.error(e));
        }
}

//game loop start question->wait->end question->repaet
function startQuestion(room:Room,index:number)
{
    const q=room.questions[index];
    if(!q) return;
    room.currentIndex=index;
    room.questionActive=true;
    room.questionStartedAt=Date.now();
    room.answers.clear();

    broadcast(room,{
        type:"question_started",
        index,
        total:room.questions.length,
        endsAt:room.questionStartedAt+q.timeTaken*1000,
        question:{
            id:q.id,
            text:q.text,
            timeTaken:q.timeTaken,
            //no iscoreect here as players could cheat
            options:q.options.map(o=>({id:o.id,text:o.text}))
        },
    });

    //the server decides when time is over not client
    room.timer=setTimeout(()=>endQuestion(room),q.timeTaken*1000);
}

function endQuestion(room:Room)
{
    if(!room.questionActive) return ;
    room.questionActive=false;
    if(room.timer) clearTimeout(room.timer);

    const q= room.questions[room.currentIndex];
    if(!q) return;
    const correctOptionId= q.options.find(o=>o.isCorrect)?.id;
    const board= leaderboard(room);

    //each player gets its own result
    for(const [id,player] of room.players)
    {
        const mine= room.answers.get(id);
        send(player.socket,{
            type:"question_ended",
            correctOptionId,
            yourResult:{
                answered: !!mine,
                isCorrect:mine?.isCorrect??false,
                points:mine?.points??0
            },
            leaderboard:board
        });
    }
    send(room.hostSocket,{
        type:"question_ended",
        correctOptionId,
        answeredCount:room.answers.size,
        leaderboard:board
    });

    const isLast= room.currentIndex>=room.questions.length-1;
    room.timer= setTimeout(()=>{
        if(isLast) finishQuiz(room);
        else startQuestion(room,room.currentIndex+1);
    },PAUSE_MS);
}

async function finishQuiz(room:Room)
{
    room.status="FINISHED";
    room.timer=null;
    broadcast(room,{type:"quiz_ended",leaderboard:leaderboard(room)});
    rooms.delete(room.joinCode);

    try{
        await prismaClient.quizSession.update({
            where:{id:room.sessionId},
            data:{status:"COMPLETED",endedAt:new Date()},
        })
    }catch(err)
    {
        console.error(err);
    }
}

//message handlers
async function handleHostJoin(socket:WebSocket,ctx:Ctx,msg:Msg<"host_join">)
{
    if(ctx.current) return send(socket,err("already joined"));

    //check the host's login token
    let userId:string|undefined;
    try{
        ctx.joining=true;
        const token =msg.token.replace(/^Bearer\s+/i,"");
        const payload=jwt.verify(token,JWT_SECRET) as any;
        userId=payload.userId;
    }
    catch
    {
        return send(socket,err("invalid token"));
    }

    const room= await getOrCreateRoom(msg.joinCode);
    if(!room)
    {
        return send(socket,err("room not found or already started"));
    }
    if(room.hostId!==userId)
    {
        return send(socket,err("this session isnt yours"));
    }

    room.hostSocket=socket;
    ctx.current={role:"host",joinCode:room.joinCode};
    send(socket,{type:"host_joined",status:room.status,players:usernames(room)});
}

async function handleJoin(socket:WebSocket,ctx:Ctx,msg:Msg<"join_session">){
    if(ctx.current||ctx.joining) return send(socket,err("already joined"));
    try{
        ctx.joining = true;
        const username= msg.username;
        const room= await getOrCreateRoom(msg.joinCode);
        if(!room||room.status!=="WAITING")
        {
            return send(socket,err("room not found or already started"));
        }

        const taken=[...room.players.values()].some(p=>p.username.toLocaleLowerCase()===username.toLocaleLowerCase());
        if(taken) return send(socket,err("username already taken"));

        //save the participant 
        const participant=await prismaClient.participant.create({
            data:{
                username,
                sessionId:room.sessionId
            }
        }).catch((e:any)=>(e.code==="P2002"?null:Promise.reject(e)));
        //P2002v error is because of same name in the session

        if(!participant)
        {
            return send(socket,err("that username is taken"));
        }
        
        //the host might have started the session while we were saving
        if(room.status!=="WAITING")
        {
            await prismaClient.participant.delete({where:{id:participant.id}}).catch(()=>{});
            return send(socket,err("quiz already started"));
        }

        room.players.set(participant.id, { id: participant.id, username, socket, score: 0 });
        ctx.current = { role: "player", joinCode: room.joinCode, playerId: participant.id };

        send(socket,{type:"joined",playerId:participant.id,players:usernames(room)});
        broadcast(room,{type:"player_joined",username},participant.id);
    }finally{
        ctx.joining=false;
    }
}

async function handleStart(socket:WebSocket,ctx:Ctx)
{
    if(ctx.current?.role!=="host") return send(socket,err("only host can start the quiz"));

    const room= rooms.get(ctx.current.joinCode);
    if(!room)
    {
        return send(socket,err("room not found"));
    }
    if(room.status!=="WAITING")
    {
        return send(socket,err("quiz already started"))
    }
    if(room.players.size===0) 
    {
        return send(socket,err("no players have joined yet"))
    }

    room.status="IN_PROGRESS";

    try{
        const questions=await prismaClient.question.findMany({
            where:{
                quizId:room.quizId
            },
            orderBy:{
                order:"asc"
            },
            include:{
                options:true
            }
        });
        if(questions.length===0) throw new Error("quiz has no questions");

        room.questions=questions.map((q)=>({
            id:q.id,
            text:q.text,
            timeTaken:q.timeLimit,
            options:q.options.map((o)=>({
                id:o.id,
                text:o.text,
                isCorrect:o.isCorrect
            })),
        }));
        await prismaClient.quizSession.update({
            where:{id:room.sessionId},
            data:{status:"IN_PROGRESS",startedAt:new Date()},
        });
    }
    catch(e)
    {
        console.error(e);
        room.status="WAITING";
        return send(socket,err("could not start the quiz"));
    }
    startQuestion(room,0);
}

function handleAnswer(socket:WebSocket,ctx:Ctx,msg:Msg<"submit_answer">)
{
    if(ctx.current?.role!=="player") return send(socket,err("only players can answer"));

    const room= rooms.get(ctx.current.joinCode);
    if(!room||room.status!=="IN_PROGRESS"||!room.questionActive)
    {
        return send(socket,err("no questions is active right now"));
    }

    const q= room.questions[room.currentIndex];
    if(!q) return;
    if(msg.questionId!==q.id) return send(socket,err("this is not the current question"));

    const playerId= ctx.current.playerId;
    if(room.answers.has(playerId)) return send(socket,err("you already answered"));

    const option =q.options.find((o)=>o.id===msg.optionId);
    if(!option) return send(socket,err("invalid option"));

    //the server measure the time 
    const limitMs=q.timeTaken*1000;
    const timeTaken=Date.now()-room.questionStartedAt;
    if(timeTaken>limitMs) return send(socket,err("time is up"));

    //correct =between 500 to 1000 (faster =more)
    const points= option.isCorrect? Math.round(MAX_POINTS*(1-timeTaken/limitMs/2)):0;

    //save in memory first so a second click cant sneak in
    room.answers.set(playerId,{optionId:option.id,isCorrect:option.isCorrect,points});
    const player= room.players.get(playerId)!;
    player.score+=points;

    send(socket,{type:"answer_received"});

    //save in the database in bg 
    prismaClient.$transaction([
        prismaClient.participantAnswer.create({
            data:{
                participantId:playerId,
                questionId:q.id,
                optionId:option.id,
                timeTook:timeTaken,
                isCorrect:option.isCorrect,
                points
            },
        }),
        prismaClient.participant.update({
            where:{id:player.id},
            data:{score:{increment:points}},
        }),
    ]).catch((e)=>console.error(e));

    //everyone answered->no need to wait for timer
    if(allConnectionsAnswered(room)) endQuestion(room);
}

//THE SERVER: accept connections, route messages, handle leaving 
const wss = new WebSocketServer({ port: Number(process.env.WS_PORT) || 8080 });
 
wss.on("connection", (socket) => {
  const ctx: Ctx = { current: null, joining: false };
 
  socket.on("error", (e) => console.error("socket error", e));
 
  socket.on("message", async (raw) => {
    let json: unknown;
    try {
      json = JSON.parse(raw.toString());
    } catch {
      return send(socket, err("invalid JSON"));
    }
 
    const parsed = ClientMessage.safeParse(json);

if (!parsed.success) {
  console.error("Invalid WebSocket message:", json);
  console.error("Validation errors:", parsed.error.issues);

  return send(socket, err("invalid message"));
}
    const msg = parsed.data;
 
    try {
      switch (msg.type) {
        case "host_join":
          await handleHostJoin(socket, ctx, msg);
          break;
        case "join_session":
          await handleJoin(socket, ctx, msg);
          break;
        case "start_quiz":
          await handleStart(socket, ctx);
          break;
        case "submit_answer":
          handleAnswer(socket, ctx, msg);
          break;
      }
    } catch (e) {
      console.error(e);
      send(socket, err("server error"));
    }
  });
 
  socket.on("close", () => {
    const cur = ctx.current;
    if (!cur) return;
    const room = rooms.get(cur.joinCode);
    if (!room) return;
 
    if (cur.role === "host") {
      if (room.hostSocket === socket) room.hostSocket = null;
    } else {
      const player = room.players.get(cur.playerId);
      if (player) {
        if (room.status === "WAITING") {
          // left the lobby: remove them completely
          room.players.delete(player.id);
          prismaClient.participant
            .delete({ where: { id: player.id } })
            .catch((e) => console.error("could not delete participant", e));
        } else {
          // left during the game: keep their score on the leaderboard
          player.socket = null;
        }
        broadcast(room, { type: "player_left", username: player.username });
 
        // maybe the only player we were waiting for just left
        if (room.status === "IN_PROGRESS" && room.questionActive && allConnectionsAnswered(room)) {
          endQuestion(room);
        }
      }
    }
 
    cleanIfEmpty(room);
  });
});
 
console.log("ws server on", process.env.WS_PORT || 8080);
