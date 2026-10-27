"use client";

import { WS_URL } from "@/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { useSocket } from "@/hooks/useSocket";
import Board, { BoardEntry } from "@/components/Board";

const font = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const LETTERS=["A","B","C","D","E","F"];

// lobby    = waiting for players, host presses Start
// question = a question is live
// result   = answer + leaderboard between questions
// midgame  = host came back (refresh) while a game was already running
// ended    = quiz finishe

type Phase="lobby"|"question"|"result"|"midgame"|"ended";

type HostQuestion={
    id:string;
    text:string;
    options:{id:string;text:string}[];
    index:number;
    total:number;
    timeLimit:number;
    endsAtLocal:number;//from device clocks perspective
}

type RoundResult= {
    correctOptionId:string;
    answeredCount:number;
    leaderboard:BoardEntry[];
}
const primaryButton =
  "rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-8 py-4 text-xl font-extrabold text-[#43091f] transition hover:-rotate-1 motion-reduce:transition-none motion-reduce:hover:transform-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]";

export default function HostLobby({
  joinCode,
  sessionId,
}: {
  joinCode: string;
  sessionId: string;
}) {
    const router= useRouter();

    const [phase,setPhase]= useState<Phase>("lobby");
    const [players,setPlayers]= useState<string[]>([]);
    const [joined,setJoined]=useState(false);  //server accepted us as host
    const [starting, setStarting] = useState(false);
    const [error,setError]= useState("");

    //game state
    const [question,setQuestion]=useState<HostQuestion|null>(null);
    const [timeLeftMs,setTimeLeftMs]=useState(0);
    const [answerCount,setAnswerCount]=useState<{count:number;total:number;}|null>(null);
    const [result, setResult] = useState<RoundResult | null>(null);
    const [finalBoard, setFinalBoard] = useState<BoardEntry[]>([]);

    const {status,send,reconnect}=useSocket({
        url:WS_URL,

        //as soon we are connected ,tell the server who we are
        onOpen:(sendMessage)=>{
            const token= localStorage.getItem("token");
            if(!token)
            {
                router.replace("/login");
                return;
            }
            setError("");
            sendMessage({type:"host_join",joinCode:joinCode,token});
        },

        //react to everything the server tells us
        onMessage:handleMessage,
    });

    function handleMessage(msg:any){
        switch(msg.type){
            case "host_joined":
                setJoined(true);
                setPlayers(msg.players??[]);
                //if we come back in the middle of game dont show the lobby
                if(msg.status!=="WAITING") setPhase("midgame");
                break;

            case "player_joined":
                setPlayers((current)=>current.includes(msg.username)?current:[...current,msg.username]);
                break;

            case "player_left":
                setPlayers((current)=>current.filter((name)=>name!==msg.username));
                break;

            case "question_started": {
                const limit: number = msg.question.timeTaken;
                setStarting(false);
                setQuestion({
                id: msg.question.id,
                text: msg.question.text,
                options: msg.question.options ?? [],
                index: msg.index,
                total: msg.total,
                timeLimit: limit,
                // We use this device's clock, so a wrong clock can't break the timer
                endsAtLocal: Date.now() + limit * 1000,
                });
                setTimeLeftMs(limit * 1000);
                setAnswerCount(null);
                setResult(null);
                setPhase("question");
                break;
            }
            
            case "answer_count":
                setAnswerCount({count:msg.count,total:msg.total});
                break;
            
            case "question_ended":
                setResult({
                    correctOptionId: msg.correctOptionId,
                    answeredCount: msg.answeredCount ?? 0,
                    leaderboard: msg.leaderboard ?? [],
                });
                setPhase("result");
                break;

            case "quiz_ended":
                setFinalBoard(msg.leaderboard??[]);
                setPhase("ended");
                break;

            case "error":
                if(msg.message==="invalid token"){
                    localStorage.removeItem("token");
                    router.replace("/login");
                    return;
                }
                setError(msg.message);
                setStarting(false);
                break;
        }
    }

    useEffect(()=>{
        if(phase!=="question"||!question) return;

        const tick=()=>
            setTimeLeftMs(Math.max(0,question.endsAtLocal-Date.now()));
        tick();

        const id=setInterval(tick,100);
        return ()=>clearInterval(id);
    },[phase,question]);

    function handleStart(){
        setError("");
        setStarting(true);
        const sent= send({type:"start_quiz"});
        if(!sent){
            setError("not connected to the game server.try reconnecting.");
            setStarting(false);
        }
    }

    const prettyCode = (joinCode ?? "").replace(/^(\d{3})(\d{3})$/, "$1 $2");
    const canStart =
        status === "open" && joined && players.length > 0 && !starting;
    const secondsLeft = Math.ceil(timeLeftMs / 1000);
    const statusText =
        status === "connecting"
        ? "Connecting..."
        : status === "closed"
            ? "Disconnected"
            : joined
            ? "Live"
            : "Opening the room...";

    return (
    <main
      className={`${font.className} flex min-h-screen flex-col bg-[#5c0f2b] px-5 py-6 text-[#ffc2d1] sm:px-12`}
    >
      <header className="flex items-center justify-between">
        <span className="text-[28px] font-extrabold tracking-[-0.04em] text-[#ffd24a]">
          quizo
        </span>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border-[3px] border-[#ffc2d1] px-5 py-2 text-base font-extrabold text-[#ffc2d1] transition hover:bg-[#ffc2d1] hover:text-[#43091f] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
        >
          Leave
        </button>
      </header>
 
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-8">
        {phase !== "lobby" && phase !== "ended" && status === "closed" && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#43091f] bg-[#43091f] px-4 py-3 text-sm font-bold text-[#ffd24a]"
          >
            <span>Lost connection to the game server.</span>
            <button
              type="button"
              onClick={reconnect}
              className="rounded-full border-[3px] border-[#ffd24a] px-4 py-1 font-extrabold transition hover:bg-[#ffd24a] hover:text-[#43091f]"
            >
              Reconnect
            </button>
          </div>
        )}
 
        {phase === "ended" ? (
          <div>
            <div className="text-center">
              <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
                {finalBoard[0]
                  ? `${finalBoard[0].username} takes the crown!`
                  : "That's a wrap!"}
              </h1>
              <p className="mb-8 mt-3 text-lg font-medium">
                The quiz is finished. Here's how everyone did.
              </p>
            </div>
 
            <Board entries={finalBoard} />
 
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className={primaryButton}
              >
                Back home
              </button>
            </div>
          </div>
        ) : phase === "question" && question ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-[#43091f] px-4 py-1.5 text-base font-extrabold text-[#ffd24a]">
                Question {question.index + 1} of {question.total}
              </span>
              <span
                className="text-5xl font-extrabold text-[#ffd24a]"
                aria-label={`${secondsLeft} seconds left`}
              >
                {secondsLeft}s
              </span>
            </div>
 
            {/* Timer bar */}
            <div className="mb-6 h-4 w-full overflow-hidden rounded-full bg-[#43091f]">
              <div
                className="h-full rounded-full bg-[#ffd24a]"
                style={{
                  width: `${Math.min(
                    100,
                    (timeLeftMs / (question.timeLimit * 1000)) * 100
                  )}%`,
                }}
              />
            </div>
 
            <div className="rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] p-6 text-[#43091f] shadow-[6px_6px_0_#ffd24a] sm:p-10">
              <h1 className="text-[clamp(26px,5vw,44px)] font-extrabold leading-tight">
                {question.text}
              </h1>
            </div>
 
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {question.options.map((option, i) => (
                <li
                  key={option.id}
                  className="flex items-center gap-3 rounded-2xl border-[3px] border-[#43091f] bg-[#ffc2d1] px-4 py-4 text-xl font-extrabold text-[#43091f]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#43091f] text-base text-[#ffd24a]">
                    {LETTERS[i] ?? i + 1}
                  </span>
                  <span>{option.text}</span>
                </li>
              ))}
            </ul>
 
            <p
              role="status"
              className="mt-8 text-center text-2xl font-extrabold text-[#fff5f7]"
            >
              {answerCount
                ? `${answerCount.count} of ${answerCount.total} answered`
                : "Players are answering..."}
            </p>
          </>
        ) : phase === "result" && question && result ? (
          <>
            <h1 className="text-[clamp(32px,6vw,48px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              Here's the answer
            </h1>
            <p className="mb-6 mt-3 text-lg font-medium">
              {question.text} · {result.answeredCount} answered
            </p>
 
            <ul className="space-y-3">
              {question.options.map((option, i) => {
                const isCorrect = option.id === result.correctOptionId;
                return (
                  <li
                    key={option.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#43091f] px-4 py-3 text-xl font-extrabold text-[#43091f] ${
                      isCorrect ? "bg-[#ffd24a]" : "bg-[#ffc2d1] opacity-60"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#43091f] text-sm text-[#ffd24a]">
                        {LETTERS[i] ?? i + 1}
                      </span>
                      {option.text}
                    </span>
                    <span className="shrink-0 text-sm">
                      {isCorrect ? "✓ correct" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
 
            <h2 className="mb-3 mt-8 text-2xl font-extrabold text-[#fff5f7]">
              Leaderboard
            </h2>
            <Board entries={result.leaderboard} limit={5} />
 
            <p className="mt-6 flex items-center justify-center gap-3 text-base font-medium">
              <span className="h-3 w-3 animate-pulse rounded-full bg-[#ffd24a] motion-reduce:animate-none" />
              <span role="status">
                {question.index + 1 >= question.total
                  ? "Final results coming up..."
                  : "Next question coming up..."}
              </span>
            </p>
          </>
        ) : phase === "midgame" ? (
          <div className="text-center">
            <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              Game in progress
            </h1>
            <p className="mt-4 text-lg font-medium">
              You're back in. The next question will show up here in a moment.
            </p>
          </div>
        ) : (
          <>
            <p className="text-center text-sm font-extrabold uppercase tracking-widest text-[#ffd24a]">
              Join with this code
            </p>
 
            <div className="mt-3 rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] px-4 py-8 text-center text-[#43091f] shadow-[6px_6px_0_#ffd24a]">
              <p
                aria-label={`Join code ${(joinCode ?? "").split("").join(" ")}`}
                className="text-[clamp(52px,14vw,104px)] font-extrabold leading-none tracking-[0.06em]"
              >
                {prettyCode}
              </p>
            </div>
 
            <div className="mt-4 flex items-center justify-center gap-3 text-sm font-bold">
              <span
                className={`h-3 w-3 rounded-full ${
                  status === "open" && joined
                    ? "bg-[#ffd24a]"
                    : "bg-[#ffc2d1]/40"
                }`}
              />
              <span role="status">{statusText}</span>
              {status === "closed" && (
                <button
                  type="button"
                  onClick={reconnect}
                  className="rounded-full border-[3px] border-[#ffc2d1] px-4 py-1 font-extrabold transition hover:bg-[#ffc2d1] hover:text-[#43091f] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
                >
                  Reconnect
                </button>
              )}
            </div>
 
            <div className="mt-10">
              <h2 className="text-2xl font-extrabold text-[#fff5f7]">
                Players ({players.length})
              </h2>
 
              {players.length === 0 ? (
                <p className="mt-3 text-base font-medium">
                  Crickets... waiting for people to show up.
                </p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-3">
                  {players.map((name) => (
                    <li
                      key={name}
                      className="rounded-full border-[3px] border-[#43091f] bg-[#ffc2d1] px-4 py-2 text-base font-extrabold text-[#43091f]"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
 
            {error && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border-[3px] border-[#43091f] bg-[#43091f] px-4 py-3 text-sm font-bold text-[#ffd24a]"
              >
                {error}
              </div>
            )}
 
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="mt-8 w-full rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-5 py-5 text-2xl font-extrabold text-[#43091f] transition hover:-translate-y-0.5 hover:-rotate-1 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:rotate-0 motion-reduce:transition-none motion-reduce:hover:transform-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
            >
              {starting ? "Starting..." : "Start the quiz"}
            </button>
            {players.length === 0 && (
              <p className="mt-3 text-center text-sm font-medium">
                You need at least one player to start.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}