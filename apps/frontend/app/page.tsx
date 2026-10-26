"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";

const font = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export default function Dashboard() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [isLoggedIn,setIsLoggedIn]=useState<boolean|null>(null);

  useEffect(()=>{
    setIsLoggedIn(!!localStorage.getItem("token"));
  },[]);

  function handleLogout(){
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  }
  function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const code = joinCode.trim();

    if (!code) return;

    // Change this route to match your actual quiz-taking page.
    router.push(`/quiz/${encodeURIComponent(code)}`);
  }

return (
    <main
      className={`${font.className} flex min-h-screen flex-col bg-[#5c0f2b] px-5 pb-12 pt-6 text-[#ffc2d1] sm:px-12`}
    >
      <header className="flex items-center justify-between">
        <span className="text-[28px] font-extrabold tracking-[-0.04em] text-[#ffd24a]">
          quizo
        </span>
 
        <nav className="flex min-h-[44px] items-center gap-3">
          {isLoggedIn === true && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border-[3px] border-[#ffc2d1] px-5 py-2 text-base font-extrabold text-[#ffc2d1] transition hover:bg-[#ffc2d1] hover:text-[#43091f] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
            >
              Log out
            </button>
          )}
 
          {isLoggedIn === false && (
            <>
              <Link
                href="/login"
                className="rounded-full border-[3px] border-[#ffc2d1] px-5 py-2 text-base font-extrabold text-[#ffc2d1] transition hover:bg-[#ffc2d1] hover:text-[#43091f] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full border-[3px] border-[#43091f] bg-[#ffd24a] px-5 py-2 text-base font-extrabold text-[#43091f] transition hover:-rotate-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>
 
      <section className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center pb-[6vh] text-center">
        <h1 className="text-[clamp(40px,8vw,72px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
          Got a code? Spill it.
        </h1>
        <p className="mb-9 mt-4 text-[clamp(17px,2.4vw,20px)] font-medium">
          Type it in and jump into the chaos.
        </p>
 
        <form onSubmit={handleJoin} className="flex w-full flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter code"
            aria-label="Quiz code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-[20px] border-[3px] border-[#43091f] bg-[#ffc2d1] px-4 py-5 text-center text-[clamp(26px,5vw,40px)] font-extrabold tracking-[0.08em] text-[#43091f] shadow-[6px_6px_0_#ffd24a] outline-none placeholder:font-extrabold placeholder:tracking-[0.02em] placeholder:text-[#43091f]/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a]"
          />
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="rounded-[20px] border-[3px] border-[#43091f] bg-[#ffd24a] px-9 py-4 text-[clamp(20px,3.5vw,26px)] font-extrabold text-[#43091f] transition hover:-translate-y-0.5 hover:-rotate-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:rotate-0 motion-reduce:transition-none motion-reduce:hover:transform-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
          >
            Join
          </button>
        </form>
 
        <div className="my-12 mb-6 flex w-full items-center gap-4 text-base font-medium before:flex-1 before:border-t-2 before:border-dashed before:border-[#ffc2d1]/35 before:content-[''] after:flex-1 after:border-t-2 after:border-dashed after:border-[#ffc2d1]/35 after:content-['']">
          <span>no code? be the boss</span>
        </div>
 
        <Link
          href={isLoggedIn ? "/quiz/create" : "/login"}
          className="inline-block rounded-full border-[3px] border-[#ffc2d1] px-9 py-4 text-[clamp(20px,3.5vw,24px)] font-extrabold text-[#ffc2d1] transition hover:rotate-[1.5deg] hover:bg-[#ffc2d1] hover:text-[#43091f] motion-reduce:transition-none motion-reduce:hover:transform-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
        >
          Create a quiz
        </Link>
      </section>
    </main>
  );
}
 