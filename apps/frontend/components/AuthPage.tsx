"use client";

import { HTTP_BACKEND } from "@/config";
import { useRouter } from "next/navigation";
import React , { useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
 

const font = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});
 
const inputClass =
  "w-full rounded-2xl border-[3px] border-[#43091f] bg-[#fff5f7] px-4 py-3.5 text-base font-bold text-[#43091f] outline-none placeholder:font-medium placeholder:text-[#43091f]/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a]";
 

export function AuthPage({isLogin}:{isLogin:boolean}){
    const router= useRouter();

    const [name,setName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]= useState("");
    const [error,setError]= useState("");
    const [loading,setLoading]= useState(false);

    async function handleSubmit(e:React.FormEvent)
    {
        e.preventDefault();
        setError("");
        setLoading(true);

        try{
            const endPoint=isLogin?"/login":"/signup";

            const body=isLogin?{email,password}:{name,email,password};

            const response= await fetch(`${HTTP_BACKEND}${endPoint}`,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(body)
            });

            const data=await response.json();
            
            if(!response.ok)
            {
                throw new Error(data.message||"Something went wrong");
            }
            if(isLogin)
            {
                if(!data.token)
                {
                    throw new Error("token was not returned by the server");
                }
                localStorage.setItem("token",data.token);
                router.push("/");
            }
            else{
                router.push("/login");
            }
        }
        catch(err)
        {
            setError(err instanceof Error?err.message:"unable to connect to the server");
        }finally{
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
 
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">
        <h1 className="text-[clamp(36px,7vw,56px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
          {isLogin ? "Back again? Nice." : "New here? Welcome."}
        </h1>
        <p className="mb-8 mt-3 text-lg font-medium">
          {isLogin
            ? "Log in and get back to quizzing."
            : "Make an account and start the fun."}
        </p>
 
        <div className="rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] p-6 text-[#43091f] shadow-[6px_6px_0_#ffd24a] sm:p-8">
          {/* Login / Signup switch */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border-[3px] border-[#43091f] bg-[#fff5f7] p-1">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className={`rounded-xl py-2.5 text-sm font-extrabold transition ${
                isLogin
                  ? "bg-[#43091f] text-[#ffd24a]"
                  : "text-[#43091f]/60 hover:text-[#43091f]"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className={`rounded-xl py-2.5 text-sm font-extrabold transition ${
                !isLogin
                  ? "bg-[#43091f] text-[#ffd24a]"
                  : "text-[#43091f]/60 hover:text-[#43091f]"
              }`}
            >
              Sign up
            </button>
          </div>
 
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-extrabold">
                  What should we call you?
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className={inputClass}
                />
              </div>
            )}
 
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-extrabold">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>
 
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-extrabold">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Shh, it's a secret"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                className={inputClass}
              />
            </div>
 
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
              disabled={loading}
              className="w-full rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-5 py-4 text-xl font-extrabold text-[#43091f] transition hover:-translate-y-0.5 hover:-rotate-1 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:rotate-0 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              {loading
                ? "One sec..."
                : isLogin
                  ? "Let's go"
                  : "Create my account"}
            </button>
          </form>
 
          <p className="mt-6 text-center text-sm font-medium">
            {isLogin ? "New around here?" : "Already one of us?"}{" "}
            <button
              type="button"
              onClick={() => router.push(isLogin ? "/signup" : "/login")}
              className="font-extrabold underline decoration-2 underline-offset-4"
            >
              {isLogin ? "Join quizo" : "Log in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
