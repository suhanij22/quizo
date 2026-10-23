
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const code = joinCode.trim();

    if (!code) return;

    // Change this route to match your actual quiz-taking page.
    router.push(`/quiz/${encodeURIComponent(code)}`);
  }

  return (
    <main className="min-h-screen bg-[#f8f8f5] text-[#191919]">
      {/* Navbar */}
      <nav className="border-b border-black/[0.06] bg-[#f8f8f5]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <span className="flex h-10 w-10 rotate-[-5deg] items-center justify-center rounded-xl bg-[#dfff62] text-xl font-black">
              Q
            </span>
            <span className="text-2xl font-black tracking-tight">
              quizo<span className="text-[#7656f6]">.</span>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-gray-500 sm:block">
              Ready for a challenge?
            </span>
            <button
              onClick={() => router.push("/profile")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e2ff] font-bold text-[#7656f6] transition hover:bg-[#dcd2ff]"
              aria-label="Profile"
            >
              U
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        {/* Welcome section */}
        <section className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600">
            <span className="h-2 w-2 rounded-full bg-[#a4d927]" />
            YOUR QUIZ SPACE
          </div>

          <h1 className="text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Hey, curious mind<span className="text-[#7656f6]">.</span>
            <span className="ml-2 inline-block">✳</span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-gray-500 sm:text-lg">
            Got a code? Jump right in. Want to host? Create a quiz and bring
            everyone together.
          </p>
        </section>

        {/* Join quiz card */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#dfff62] p-6 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[35px] border-black/[0.04]" />
          <div className="pointer-events-none absolute bottom-[-50px] right-40 text-8xl opacity-10">
            ?
          </div>

          <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-black/[0.07] px-3 py-2 text-xs font-bold uppercase tracking-wider">
                <span>⚡</span> Got a game code?
              </div>

              <h2 className="max-w-lg text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                The fun starts with one code.
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-black/60 sm:text-base">
                Enter the join code shared by your host and get ready to play.
              </p>
            </div>

            <form
              onSubmit={handleJoin}
              className="rounded-2xl bg-white p-3 shadow-sm sm:p-4"
            >
              <label
                htmlFor="joinCode"
                className="mb-3 block px-2 text-sm font-bold"
              >
                Enter your join code
              </label>

              <input
                id="joinCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. 347901"
                autoComplete="off"
                className="w-full rounded-xl border border-gray-200 bg-[#f8f8f5] px-4 py-4 text-lg font-bold tracking-widest outline-none transition placeholder:font-normal placeholder:tracking-normal focus:border-[#7656f6] focus:ring-4 focus:ring-[#7656f6]/10"
                required
              />

              <button
                type="submit"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#191919] px-5 py-4 font-bold text-white transition hover:bg-[#333333] active:scale-[0.99]"
              >
                Join quiz <span>→</span>
              </button>
            </form>
          </div>
        </section>

        {/* Create quiz section */}
        <section className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7656f6]">
                Your turn to host
              </p>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Make it a quiz.
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 sm:text-base">
                Create a quiz, invite your friends, and see who comes out on top.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Create quiz */}
            <button
              onClick={() => router.push("/create-quiz")}
              className="group flex min-h-[245px] flex-col justify-between rounded-[26px] border border-gray-200 bg-white p-6 text-left transition duration-200 hover:-translate-y-1 hover:border-[#7656f6]/40 hover:shadow-xl hover:shadow-purple-100/60 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8e2ff] text-3xl">
                  ✳
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-xl transition group-hover:border-[#7656f6] group-hover:bg-[#7656f6] group-hover:text-white">
                  ↗
                </span>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-black">Create a quiz</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  Write questions, add answer options, and build your own quiz.
                </p>
              </div>
            </button>

            {/* Host live quiz */}
            <button
              onClick={() => router.push("/host")}
              className="group flex min-h-[245px] flex-col justify-between rounded-[26px] bg-[#7656f6] p-6 text-left text-white transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-200/70 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                  🎮
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-xl transition group-hover:bg-white group-hover:text-[#7656f6]">
                  ↗
                </span>
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-black">Host a live quiz</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                  Start a live session, share the join code, and compete in real time.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Bottom banner */}
        <section className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffe5d7] text-2xl">
              🧠
            </div>
            <div>
              <h3 className="font-extrabold">Stay curious.</h3>
              <p className="mt-1 text-sm text-gray-500">
                Every question is a chance to learn something new.
              </p>
            </div>
          </div>

          <span className="text-sm font-bold text-[#7656f6]">
            Think. Play. Repeat. ✳
          </span>
        </section>

        <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-gray-200 pt-6 text-xs text-gray-400 sm:flex-row">
          <span>© 2026 Quizo. Made for curious minds.</span>
          <span>Think smart. Play together.</span>
        </footer>
      </div>
    </main>
  );
}
