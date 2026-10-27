"use client";

import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
 
const font = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});
 
const fieldClass =
  "w-full rounded-2xl border-[3px] border-[#43091f] bg-[#fff5f7] px-4 py-3.5 text-base font-bold text-[#43091f] outline-none placeholder:font-medium placeholder:text-[#43091f]/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a]";

export default function CreateQuiz(){
    const [title,setTitle]= useState("");
    const [description,setDescription]= useState("");
    const [loading,setLoading]= useState(false);
    const [error,setError]=useState("");

    const router= useRouter();

    async function handleCreateQuiz(e:FormEvent<HTMLFormElement>){
        e.preventDefault();
        setError("");

        if(!title.trim())
        {
            setError("please enter a quiz title");
            return;
        }
        setLoading(true);

        try{
            const token =localStorage.getItem("token");
            if(!token)
            {
                setError("please log in before creating a quiz");
                router.push("/login");
                return;
            }

            const response= await axios.post(`${HTTP_BACKEND}/quiz/create`,
                {
                    title:title.trim(),
                    description:description.trim(),
                },
                {
                    headers:{
                        Authorization:`Bearer ${token}`,
                    },
                }
            );

            const quizId= response.data?.quiz?.id;

            if(!quizId){
                throw new Error("quiz id was not returned by the backend");
            }

            router.push(`/quiz/${encodeURIComponent(quizId)}/questions`);
        }
        catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.log("Create quiz error:", err.response?.data);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message || "Failed to create quiz."
        );
      }
    } else {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  } finally {
    setLoading(false);
  }
    }

   
    return (
    <main
      className={`${font.className} flex min-h-screen flex-col bg-[#5c0f2b] px-5 py-6 text-[#ffc2d1] sm:px-12`}
    >
      <header>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[28px] font-extrabold tracking-[-0.04em] text-[#ffd24a] focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
        >
          quizo
        </button>
      </header>
 
      <section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center pb-10">
        <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
          Cook up a quiz.
        </h1>
        <p className="mb-8 mt-3 text-lg font-medium">
          Name it first. You'll add the questions next.
        </p>
 
        <form
          onSubmit={handleCreateQuiz}
          className="space-y-5 rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] p-6 text-[#43091f] shadow-[6px_6px_0_#ffd24a] sm:p-8"
        >
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-extrabold">
              Quiz title
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Ultimate Movie Madness"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldClass}
            />
          </div>
 
          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-extrabold"
            >
              What's it about? (optional)
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="A line or two so players know what they're in for"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${fieldClass} resize-none`}
            />
          </div>
 
          {error && (
            <div
              role="alert"
              className="rounded-2xl border-[3px] border-[#43091f] bg-[#43091f] px-4 py-3 text-sm font-bold text-[#ffd24a]"
            >
              {error}
              {error.includes("log in") && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="underline decoration-2 underline-offset-4"
                  >
                    Go to login
                  </button>
                </>
              )}
            </div>
          )}
 
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-5 py-4 text-xl font-extrabold text-[#43091f] transition hover:-translate-y-0.5 hover:-rotate-1 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:rotate-0 motion-reduce:transition-none motion-reduce:hover:transform-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#43091f]"
          >
            {loading ? "Cooking..." : "Create quiz and add questions"}
          </button>
        </form>
      </section>
    </main>
  );
}