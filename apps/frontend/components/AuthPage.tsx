"use client";

import { HTTP_BACKEND } from "@/config";
import { useRouter } from "next/navigation";
import React , { useState } from "react";

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
                router.push("/signup");
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
  <main className="min-h-screen bg-[#f8f8f5] px-4 py-6 text-[#191919] sm:px-8 sm:py-10">
    {/* Navbar */}
    <nav className="mx-auto flex max-w-6xl items-center justify-between">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="flex items-center gap-2"
      >
        <div className="flex h-10 w-10 rotate-[-5deg] items-center justify-center rounded-xl bg-[#dfff62] text-xl font-black">
          Q
        </div>
        <span className="text-2xl font-black tracking-tight">
          quizo<span className="text-[#7656f6]">.</span>
        </span>
      </button>

      <div className="hidden items-center gap-7 text-sm font-medium text-gray-600 sm:flex">
        <span>Think. Play. Win.</span>
        <span className="rounded-full border border-gray-200 px-4 py-2">
          Your daily dose of fun ✳
        </span>
      </div>
    </nav>

    {/* Main content */}
    <section className="mx-auto grid max-w-6xl items-center gap-12 py-12 md:min-h-[80vh] md:grid-cols-2 md:gap-16 md:py-16">

      {/* Left side: Branding */}
      <div className="relative">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider">
          <span className="h-2 w-2 rounded-full bg-[#a4d927]" />
          A little curiosity goes a long way
        </div>

        <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
          Less scrolling.
          <br />
          <span className="relative inline-block">
            More knowing.
            <span className="absolute -bottom-1 left-0 -z-0 h-3 w-full -rotate-1 bg-[#dfff62]" />
          </span>
        </h1>

        <p className="mt-7 max-w-md text-base leading-7 text-gray-600 sm:text-lg">
          A curious mind is a superpower. Jump into quizzes, challenge your
          friends, and see what you really know.
        </p>

        {/* Quiz preview cards */}
        <div className="relative mt-10 max-w-md">
          <div className="rotate-[-3deg] rounded-3xl border border-black/5 bg-[#dfff62] p-5 shadow-sm transition duration-300 hover:rotate-0">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-black/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                Today's brain teaser
              </span>
              <span className="text-2xl">✳</span>
            </div>

            <h3 className="mt-5 text-xl font-extrabold sm:text-2xl">
              How curious are you?
            </h3>

            <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
              <span className="text-sm font-medium">5 questions · 2 min</span>
              <span className="text-xl">↗</span>
            </div>
          </div>

          <div className="absolute -right-3 -top-5 flex h-14 w-14 rotate-12 items-center justify-center rounded-2xl bg-[#7656f6] text-2xl shadow-lg sm:-right-6">
            🧠
          </div>
        </div>

        <div className="mt-9 flex flex-wrap gap-3">
          <span className="rounded-full bg-[#e8e2ff] px-4 py-2 text-sm font-semibold">
            ⚡ Quick quizzes
          </span>
          <span className="rounded-full bg-[#ffe5d7] px-4 py-2 text-sm font-semibold">
            🏆 Friendly battles
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold">
            🎯 New challenges
          </span>
        </div>
      </div>

      {/* Right side: Auth card */}
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-[0_16px_60px_rgba(0,0,0,0.04)] sm:p-9">

          {/* Login / Signup switch */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {isLogin ? "Good to see you again" : "Your fun starts here"}
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight">
                {isLogin ? "Welcome back." : "Join the club."}
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8e2ff] text-2xl">
              {isLogin ? "👋" : "✳"}
            </div>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#f5f5f2] p-1">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className={`rounded-lg py-3 text-sm font-bold transition ${
                isLogin
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className={`rounded-lg py-3 text-sm font-bold transition ${
                !isLogin
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold"
                >
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
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#7656f6] focus:ring-4 focus:ring-[#7656f6]/10"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#7656f6] focus:ring-4 focus:ring-[#7656f6]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="At least your secret password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#7656f6] focus:ring-4 focus:ring-[#7656f6]/10"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#dfff62] px-5 py-4 font-extrabold transition duration-200 hover:bg-[#d1f34e] hover:shadow-lg hover:shadow-lime-200/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "One sec..."
                : isLogin
                  ? "Let's get quizzing"
                  : "Create my account"}
              {!loading && (
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "New around here?" : "Already one of us?"}{" "}
            <button
              type="button"
              onClick={() => router.push(isLogin ? "/signup" : "/login")}
              className="font-bold text-[#7656f6] hover:underline"
            >
              {isLogin ? "Join Quizo" : "Log in"}
            </button>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Made for the curious. Powered by questions. ✳
        </p>
      </div>
    </section>
  </main>
);

}