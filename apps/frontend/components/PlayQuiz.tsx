"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { useSocket } from "@/hooks/useSocket";
import { HTTP_BACKEND, WS_URL } from "@/config";
import axios from "axios";
 
const font = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});
 
// Swap these for real image URLs later if you want photos.
const AVATARS = ["🦊", "🐼", "🐸", "🦄", "🐙", "🐯", "🐵", "🦉", "🐧", "🐢", "🦖", "🐝"];
const LETTERS = ["A", "B", "C", "D", "E", "F"];
type Phase = "pick" |"question"| "waiting" | "playing" | "ended"|"result";
 
type QuestionView = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  index: number;
  total: number;
  timeLimit: number; // seconds
  endsAtLocal: number; // when the timer runs out, by this device's clock
};
 
type BoardEntry = { playerId: string; username: string; score: number };
 
type RoundResult = {
  correctOptionId: string;
  answered: boolean;
  isCorrect: boolean;
  points: number;
  leaderboard: BoardEntry[];
};

const fieldClass =
  "w-full rounded-2xl border-[3px] border-[#43091f] bg-[#fff5f7] px-4 py-3.5 text-lg font-bold text-[#43091f] outline-none placeholder:font-medium placeholder:text-[#43091f]/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a]";

const primaryButton =
  "rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-8 py-4 text-xl font-extrabold text-[#43091f] transition hover:-rotate-1 motion-reduce:transition-none motion-reduce:hover:transform-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]";

// A list of players with their scores. With `limit`, shows only the top few
// (plus your own row if you are lower down).
function Board({
  entries,
  myPlayerId,
  limit,
}: {
  entries: BoardEntry[];
  myPlayerId: string;
  limit?: number;
}) {
  const ranked = entries.map((entry, i) => ({ entry, rank: i + 1 }));
  const top = limit ? ranked.slice(0, limit) : ranked;
  const mine = ranked.find((r) => r.entry.playerId === myPlayerId);
  const showMineSeparately = limit && mine && mine.rank > limit;
  const rows = showMineSeparately ? [...top, mine] : top;
 
  return (
    <ul className="space-y-3">
      {rows.map(({ entry, rank }) => (
        <li
          key={entry.playerId}
          className={`flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#43091f] px-4 py-3 text-lg font-extrabold text-[#43091f] ${
            entry.playerId === myPlayerId ? "bg-[#ffd24a]" : "bg-[#ffc2d1]"
          }`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="w-8 shrink-0 text-center">
              {["🥇", "🥈", "🥉"][rank - 1] ?? rank}
            </span>
            <span className="truncate">
              {entry.username}
              {entry.playerId === myPlayerId ? " (you)" : ""}
            </span>
          </span>
          <span className="shrink-0">{entry.score}</span>
        </li>
      ))}
    </ul>
  );
}


export default function PlayQuiz({joinCode}:{joinCode:string}){
    const router= useRouter();
    const cleanJoinCode = decodeURIComponent(joinCode).replace(/\s/g, "");


    const [codeState,setCodeState]= useState<"checking"|"ok"|"invalid">("checking");
    const [codeMessage,setCodeMessage]= useState("");
    const [quizTitle,setQuizTitle]= useState("");
    const [phase,setPhase]= useState<Phase>("pick");
    const [avatar,setAvatar]= useState(AVATARS[0]);
    const [name,setName]= useState("");
    const [myName,setMyName]= useState("");
    const [joining,setJoining]= useState(false);
    const [myPlayerId, setMyPlayerId] = useState("");
    const [players,setPlayers]= useState<string[]>([]);
  const [error, setError] = useState("");

    // Game state
  const [question, setQuestion] = useState<QuestionView | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answerReceived, setAnswerReceived] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [finalBoard, setFinalBoard] = useState<BoardEntry[]>([]);

   // One connection for the whole page. The server remembers who you are
  // by this connection, so we keep it open from "pick" until the end.
  const { status, send, reconnect } = useSocket({
    url: WS_URL,
    onMessage: handleMessage,
  });

  function handleMessage(msg: any) {
    switch (msg.type) {

      case "joined":
        setJoining(false);
        setError("");
        setPlayers(msg.players ?? []);
        setMyPlayerId(msg.playerId??"");
        setPhase("waiting");
        break;
 
      case "player_joined":
        setPlayers((cur) =>
          cur.includes(msg.username) ? cur : [...cur, msg.username]
        );
        break;
 
      case "player_left":
        setPlayers((cur) => cur.filter((n) => n !== msg.username));
        break;
 
      // The host pressed Start. The real question screen comes next.
     case "question_started": {
        const limit: number = msg.question.timeTaken;
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
        setSelectedOptionId(null);
        setAnswerReceived(false);
        setResult(null);
        setError("");
        setPhase("question");
        break;
      }

      // The server accepted our answer
      case "answer_received":
        setAnswerReceived(true);
        break;

        // Time is up (or everyone answered): show the right answer and scores
      case "question_ended":
        setResult({
          correctOptionId: msg.correctOptionId,
          answered: msg.yourResult?.answered ?? false,
          isCorrect: msg.yourResult?.isCorrect ?? false,
          points: msg.yourResult?.points ?? 0,
          leaderboard: msg.leaderboard ?? [],
        });
        setPhase("result");
        break;
 
      case "quiz_ended":
        setFinalBoard(msg.leaderboard??[]);
        setPhase("ended");
        break;
 
      case "error":
        setError(msg.message);
        setJoining(false);
        if(phase==='question'&&!answerReceived) setSelectedOptionId(null);
        break;
    }
  }

   // Check that the code is real before the person types anything
  useEffect(() => {
    async function checkCode() {
      try {

        const response = await axios.get(
          `${HTTP_BACKEND}/session/${encodeURIComponent(cleanJoinCode)}`
        );
        setQuizTitle(response.data.session?.quiz?.title ?? "");
        setCodeState("ok");
      } catch (err) {
        const httpStatus = axios.isAxiosError(err)
          ? err.response?.status
          : undefined;
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message
          : undefined;
 
        if (message && httpStatus === 404) {
          setCodeMessage("We couldn't find a game with that code.");
          setCodeState("invalid");
        } else if (message && httpStatus === 409) {
          setCodeMessage("That game has already started.");
          setCodeState("invalid");
        } else {
          // Can't check right now. That's fine, the game server checks again when you join.
          setCodeState("ok");
        }
      }
    }
 
    checkCode();
  }, [cleanJoinCode]);
 
  // The countdown. It runs only while a question is on screen.
  useEffect(() => {
    if (phase !== "question" || !question) return;
 
    const tick = () =>
      setTimeLeftMs(Math.max(0, question.endsAtLocal - Date.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [phase, question]);

  // If the connection drops while waiting, the server forgets us.
  // Send the person back to the first screen so they can join again.
  useEffect(() => {
    if (status === "closed" && (phase === "waiting" || joining)) {
      setPhase("pick");
      setJoining(false);
      setPlayers([]);
      setError("Lost connection to the game server. Reconnect, then join again.");
    }
  }, [status, phase, joining]);
 
  function handleJoin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
 
    const username = name.trim();
    if (!username) {
      setError("please pick a name first");
      return;
    }

    const sent = send({
    type: "join_session",
    joinCode: cleanJoinCode,
    username,
    });
    if (!sent) {
      setError("Not connected to the game server. Try reconnecting.");
      return;
    }
    setMyName(username);
    setJoining(true);
  }

  function handleAnswer(optionId: string) {
    if (!question || selectedOptionId !== null || timeLeftMs <= 0) return;
    setError("");
 
    const sent = send({
      type: "submit_answer",
      questionId: question.id,
      optionId,
    });
    if (!sent) {
      setError("Not connected to the game server.");
      return;
    }
    setSelectedOptionId(optionId);
  }
 
  function handleReconnect() {
    setError("");
    reconnect();
  }
 
    const prettyCode = joinCode.replace(/^(\d{3})(\d{3})$/, "$1 $2");
    const secondsLeft = Math.ceil(timeLeftMs / 1000);
    const timeIsUp = timeLeftMs <= 0;
    const myRank = (board: BoardEntry[]) =>
        board.findIndex((e) => e.playerId === myPlayerId) + 1;

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
          className="rounded-full border-[3px] border-[#ffc2d1] px-5 py-2 text-base font-extrabold text-[#ffc2d1] transition hover:bg-[#ffc2d1] hover:text-[#43091f] focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
        >
          Leave
        </button>
      </header>
 
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
        {(phase === "question" || phase === "result") && status === "closed" && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border-[3px] border-[#43091f] bg-[#43091f] px-4 py-3 text-sm font-bold text-[#ffd24a]"
          >
            You lost your connection. Your points so far are safe, but you can't
            rejoin this game.
          </div>
        )}
 
        {codeState === "checking" ? (
          <p className="text-center text-xl font-bold">Checking your code...</p>
        ) : codeState === "invalid" ? (
          <div className="text-center">
            <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              Hmm, nothing here.
            </h1>
            <p className="mb-8 mt-3 text-lg font-medium">{codeMessage}</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className={primaryButton}
            >
              Try another code
            </button>
          </div>
        ) : phase === "pick" ? (
          <>
            <p className="text-sm font-extrabold uppercase tracking-widest text-[#ffd24a]">
              {quizTitle ? `${quizTitle} · ` : ""}
              {prettyCode}
            </p>
            <h1 className="mb-6 mt-2 text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              Who goes there?
            </h1>
 
            <form
              onSubmit={handleJoin}
              className="space-y-6 rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] p-6 text-[#43091f] shadow-[6px_6px_0_#ffd24a] sm:p-8"
            >
              <div className="flex justify-center">
                <div
                  aria-hidden="true"
                  className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-[#43091f] bg-[#ffd24a] text-6xl"
                >
                  {avatar}
                </div>
              </div>
 
              <div>
                <p className="mb-3 text-sm font-extrabold">Pick your face</p>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {AVATARS.map((a, i) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAvatar(a)}
                      aria-pressed={avatar === a}
                      aria-label={`Avatar ${i + 1}`}
                      className={`flex aspect-square items-center justify-center rounded-2xl border-[3px] border-[#43091f] text-3xl transition focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a] motion-reduce:transition-none ${
                        avatar === a
                          ? "scale-105 bg-[#ffd24a] shadow-[3px_3px_0_#43091f]"
                          : "bg-[#fff5f7] hover:-translate-y-0.5"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
 
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-extrabold">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Make it a good one"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  autoComplete="off"
                  className={fieldClass}
                />
              </div>
 
              {status === "closed" && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#43091f] bg-[#fff5f7] px-4 py-3 text-sm font-bold">
                  <span>Not connected to the game server.</span>
                  <button
                    type="button"
                    onClick={handleReconnect}
                    className="rounded-full border-[3px] border-[#43091f] px-4 py-1 font-extrabold transition hover:bg-[#43091f] hover:text-[#ffd24a]"
                  >
                    Reconnect
                  </button>
                </div>
              )}
 
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border-[3px] border-[#43091f] bg-[#43091f] px-4 py-3 text-sm font-bold text-[#ffd24a]"
                >
                  {error}
                </div>
              )}
 
              <button
                type="submit"
                disabled={joining || status !== "open" || !name.trim()}
                className="w-full rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-5 py-4 text-xl font-extrabold text-[#43091f] transition hover:-translate-y-0.5 hover:-rotate-1 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:rotate-0 motion-reduce:transition-none motion-reduce:hover:transform-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#43091f]"
              >
                {joining
                  ? "Joining..."
                  : status === "connecting"
                    ? "Connecting..."
                    : "Join the game"}
              </button>
            </form>
          </>
        ) : phase === "waiting" ? (
          <div className="text-center">
            <div
              aria-hidden="true"
              className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-[3px] border-[#43091f] bg-[#ffd24a] text-7xl shadow-[6px_6px_0_#ffc2d1]"
            >
              {avatar}
            </div>
            <h1 className="mt-6 text-[clamp(32px,6vw,48px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              You're in, {myName}!
            </h1>
            <p className="mt-3 flex items-center justify-center gap-3 text-lg font-medium">
              <span className="h-3 w-3 animate-pulse rounded-full bg-[#ffd24a] motion-reduce:animate-none" />
              <span role="status">Waiting for the host to start...</span>
            </p>
 
            <div className="mt-10 text-left">
              <h2 className="text-2xl font-extrabold text-[#fff5f7]">
                Who's here ({players.length})
              </h2>
              <ul className="mt-4 flex flex-wrap gap-3">
                {players.map((p) => (
                  <li
                    key={p}
                    className={`rounded-full border-[3px] border-[#43091f] px-4 py-2 text-base font-extrabold text-[#43091f] ${
                      p === myName ? "bg-[#ffd24a]" : "bg-[#ffc2d1]"
                    }`}
                  >
                    {p}
                    {p === myName ? " (you)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : phase === "question" && question ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-[#43091f] px-4 py-1.5 text-sm font-extrabold text-[#ffd24a]">
                Question {question.index + 1} of {question.total}
              </span>
              <span
                className="text-3xl font-extrabold text-[#ffd24a]"
                aria-label={`${secondsLeft} seconds left`}
              >
                {secondsLeft}s
              </span>
            </div>
 
            {/* Timer bar */}
            <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-[#43091f]">
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
 
            <div className="rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] p-6 text-[#43091f] shadow-[6px_6px_0_#ffd24a] sm:p-8">
              <h1 className="text-[clamp(22px,4.5vw,32px)] font-extrabold leading-tight">
                {question.text}
              </h1>
            </div>
 
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {question.options.map((option, i) => {
                const picked = selectedOptionId === option.id;
                const locked = selectedOptionId !== null || timeIsUp;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => handleAnswer(option.id)}
                      disabled={locked}
                      aria-pressed={picked}
                      className={`flex w-full items-center gap-3 rounded-2xl border-[3px] border-[#43091f] px-4 py-4 text-left text-lg font-extrabold text-[#43091f] transition motion-reduce:transition-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a] ${
                        picked
                          ? "bg-[#ffd24a]"
                          : locked
                            ? "bg-[#ffc2d1] opacity-60"
                            : "bg-[#ffc2d1] hover:-translate-y-0.5 active:translate-y-px"
                      } disabled:cursor-not-allowed`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#43091f] text-base text-[#ffd24a]">
                        {LETTERS[i] ?? i + 1}
                      </span>
                      <span>{option.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
 
            <p role="status" className="mt-6 text-center text-lg font-bold">
              {selectedOptionId === null
                ? timeIsUp
                  ? "Time's up!"
                  : "Pick an answer. Faster means more points."
                : answerReceived
                  ? "Locked in! Waiting for the clock and the others..."
                  : "Sending your answer..."}
            </p>
 
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border-[3px] border-[#43091f] bg-[#43091f] px-4 py-3 text-sm font-bold text-[#ffd24a]"
              >
                {error}
              </div>
            )}
          </>
        ) : phase === "result" && question && result ? (
          <>
            <h1 className="text-[clamp(32px,6vw,48px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              {!result.answered
                ? "Too slow!"
                : result.isCorrect
                  ? `Nailed it! +${result.points}`
                  : "Oof, not this time."}
            </h1>
            <p className="mb-6 mt-3 text-lg font-medium">{question.text}</p>
 
            <ul className="space-y-3">
              {question.options.map((option, i) => {
                const isCorrect = option.id === result.correctOptionId;
                const wasMine = option.id === selectedOptionId;
                return (
                  <li
                    key={option.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#43091f] px-4 py-3 text-lg font-extrabold ${
                      isCorrect
                        ? "bg-[#ffd24a] text-[#43091f]"
                        : wasMine
                          ? "bg-[#43091f] text-[#ffc2d1]"
                          : "bg-[#ffc2d1] text-[#43091f] opacity-60"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#43091f] text-sm text-[#ffd24a]">
                        {LETTERS[i] ?? i + 1}
                      </span>
                      {option.text}
                    </span>
                    <span className="shrink-0 text-sm">
                      {isCorrect ? "✓ correct" : wasMine ? "your pick" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
 
            <h2 className="mb-3 mt-8 text-2xl font-extrabold text-[#fff5f7]">
              Leaderboard
            </h2>
            <Board
              entries={result.leaderboard}
              myPlayerId={myPlayerId}
              limit={5}
            />
 
            <p className="mt-6 flex items-center justify-center gap-3 text-base font-medium">
              <span className="h-3 w-3 animate-pulse rounded-full bg-[#ffd24a] motion-reduce:animate-none" />
              <span role="status">Next question coming up...</span>
            </p>
          </>
        ) : (
          <div>
            <div className="text-center">
              <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
                That's a wrap!
              </h1>
              {myRank(finalBoard) > 0 && (
                <p className="mb-8 mt-3 text-lg font-medium">
                  You finished #{myRank(finalBoard)}, {myName}. Nice one.
                </p>
              )}
            </div>
 
            <Board entries={finalBoard} myPlayerId={myPlayerId} />
 
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
        )}
      </section>
    </main>
  );
}