"use client";

import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { Bricolage_Grotesque } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const font = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});
 
type Quiz={
    id:string;
    title:string;
    description?:string|null;
    questions:{id:string}[];
};

export default function MyQuizzes(){
    const router= useRouter();

    const [quizzes,setQuizzes]=useState<Quiz[]>([]);
    const [pageLoading,setPageLoading]= useState(true);
    const [hostingId,setHostingId]= useState<string|null>(null);
    const [error,setError]= useState("");

    useEffect(()=>{
        async function loadQuizzes(){
            try{
                const token =localStorage.getItem("token");
                if(!token)
                {
                    router.replace("/login");
                    return;
                }

                const response=await axios.get(`${HTTP_BACKEND}/quiz/user/myQuizzes`,{
                    headers:{Authorization:`Bearer ${token}`}
                });

                setQuizzes(response.data.quizzes??[]);
            }
            catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || "Could not load your quizzes."
            : "Could not load your quizzes."
        );
      } finally {
        setPageLoading(false);
      }
    }
    loadQuizzes();
    },[router]);

    async function handleHost(quizId: string) {
    setError("");
    setHostingId(quizId);
 
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }
 
      const response = await axios.post(
        `${HTTP_BACKEND}/session/create`,
        { quizId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
 
      // Use the same host route as your add questions page
      router.push(`/session/${encodeURIComponent(response.data.sessionId)}?joinCode=${encodeURIComponent(response.data.joinCode)}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Could not start a session."
          : "Something went wrong."
      );
    } finally {
      setHostingId(null);
    }
  }
 
  return (
    <main
      className={`${font.className} flex min-h-screen flex-col bg-[#5c0f2b] px-5 py-6 text-[#ffc2d1] sm:px-12`}
    >
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[28px] font-extrabold tracking-[-0.04em] text-[#ffd24a] focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
        >
          quizo
        </button>
 
        <Link
          href="/quiz/create"
          className="rounded-full border-[3px] border-[#43091f] bg-[#ffd24a] px-5 py-2 text-base font-extrabold text-[#43091f] transition hover:-rotate-2 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
        >
          + New quiz
        </Link>
      </header>
 
      <section className="mx-auto w-full max-w-2xl flex-1 py-10">
        <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
          Your quizzes.
        </h1>
        <p className="mb-8 mt-3 text-lg font-medium">
          Pick one and put it on stage.
        </p>
 
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border-[3px] border-[#43091f] bg-[#43091f] px-4 py-3 text-sm font-bold text-[#ffd24a]"
          >
            {error}
          </div>
        )}
 
        {pageLoading ? (
          <p className="text-xl font-bold">Loading your quizzes...</p>
        ) : quizzes.length === 0 && !error ? (
          <div className="rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] p-8 text-center text-[#43091f] shadow-[6px_6px_0_#ffd24a]">
            <p className="text-2xl font-extrabold">Nothing here yet.</p>
            <p className="mb-6 mt-2 font-medium">
              Time to cook up your first quiz.
            </p>
            <Link
              href="/quiz/create"
              className="inline-block rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-6 py-3 text-lg font-extrabold transition hover:-rotate-1 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#43091f]"
            >
              Create a quiz
            </Link>
          </div>
        ) : (
          <ul className="space-y-5">
            {quizzes.map((quiz) => {
              const count = quiz.questions?.length ?? 0;
              return (
                <li
                  key={quiz.id}
                  className="rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] p-6 text-[#43091f] shadow-[4px_4px_0_#ffd24a]"
                >
                  <h2 className="text-2xl font-extrabold leading-tight">
                    {quiz.title}
                  </h2>
                  {quiz.description && (
                    <p className="mt-2 line-clamp-2 font-medium">
                      {quiz.description}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-extrabold">
                    {count} {count === 1 ? "question" : "questions"}
                  </p>
 
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleHost(quiz.id)}
                      disabled={count === 0 || hostingId !== null}
                      title={count === 0 ? "Add a question first" : undefined}
                      className="rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-6 py-2.5 text-base font-extrabold transition hover:-rotate-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:rotate-0 motion-reduce:transition-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#43091f]"
                    >
                      {hostingId === quiz.id ? "Opening..." : "Host"}
                    </button>
                    <Link
                      href={`/quiz/${encodeURIComponent(quiz.id)}/questions`}
                      className="rounded-2xl border-[3px] border-[#43091f] px-6 py-2.5 text-base font-extrabold transition hover:bg-[#43091f] hover:text-[#ffd24a] focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#43091f]"
                    >
                      {count === 0 ? "Add questions" : "View questions"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}