"use client";

import { WS_URL } from "@/config";  
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { useSocket } from "@/hooks/useSocket";
 
const font = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});
type LiveQuestion={
    index:number;
    total:number;
    text:string;
}

export default function HostLobby({
  joinCode,
  sessionId,
}: {
  joinCode: string;
  sessionId: string;
}) {
    const router= useRouter();

    const [players,setPlayers]= useState<string[]>([]);
    const [joined,setJoined]=useState(false);  //server accepted us as host
    const [starting, setStarting] = useState(false);
    const [started, setStarted] = useState(false);
    const [ended,setEnded]= useState(false);
    const [liveQuestion,setLiveQuestion]= useState<LiveQuestion|null>(null);
    const [error,setError]= useState("");

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
                if(msg.status!=="WAITING") setStarted(true);
                break;

            case "player_joined":
                setPlayers((current)=>current.includes(msg.username)?current:[...current,msg.username]);
                break;

            case "player_left":
                setPlayers((current)=>current.filter((name)=>name!==msg.username));
                break;

            case "question_started":
                setStarting(false);
                setStarted(true);
                setLiveQuestion({
                    index:msg.index,
                    total:msg.total,
                    text:msg.question.text,
                });
                break;
            
            case "quiz_ended":
                setEnded(true);
                setLiveQuestion(null);
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
 
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-8">
        {ended ? (
          <div className="text-center">
            <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              That's a wrap!
            </h1>
            <p className="mb-8 mt-3 text-lg font-medium">
              The quiz is finished. Hope everyone had fun.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-8 py-4 text-xl font-extrabold text-[#43091f] transition hover:-rotate-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
            >
              Back home
            </button>
          </div>
        ) : started ? (
          <div className="text-center">
            <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              Game on!
            </h1>
            {liveQuestion && (
              <p className="mt-4 text-lg font-medium">
                Question {liveQuestion.index + 1} of {liveQuestion.total} is
                live: {liveQuestion.text}
              </p>
            )}
            {/* TODO: the live host screen (timer, answer count, leaderboard) goes here */}
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