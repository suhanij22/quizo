"use client";

import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { useRouter,useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
 
const font = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

type Option={
    text:string,
    isCorrect:boolean
};

type SavedQuestion={
    id:string,
    text:string,
    order:number,
    options:Option[]
};
const fieldClass =
  "w-full rounded-2xl border-[3px] border-[#43091f] bg-[#fff5f7] px-4 py-3.5 text-base font-bold text-[#43091f] outline-none placeholder:font-medium placeholder:text-[#43091f]/40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a]";
 
const arrowClass =
  "flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#43091f] bg-[#ffd24a] text-2xl font-extrabold text-[#43091f] transition hover:-translate-y-0.5 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]";
 

export default function AddQuestions({quizId,}: {quizId: string;})
{
    const router= useRouter();
    
    const [quizTitle,setQuizTitle]=useState("");
    const [questions,setQuestions]=useState<SavedQuestion[]>([]);
    const [text,setText]=useState("");
    const [timeLimit,setTimeLimit]=useState(15);
    const [difficulty,setDifficulty]= useState("EASY");
    const [options,setOptions]= useState<Option[]>([
        {text:"",isCorrect:true},
        {text:"",isCorrect:false}
    ]);
    const [loading,setLoading]= useState(false);
    const [pageLoading,setPageLoading]=useState(true);
    const [error,setError]= useState("");
    const [success,setSuccess]= useState("");
    // Which page we are on. If current === questions.length, it's the "new question" form.
    const [current, setCurrent] = useState(0);

    useEffect(()=>{
        async function loadQuiz(){
            try{
                const token =localStorage.getItem("token");
                if(!token)
                {
                    router.push("/login");
                    return;
                }

                const response=await axios.get(`${HTTP_BACKEND}/quiz/${encodeURIComponent(quizId)}`,
                {
                    headers:{
                        Authorization:`Bearer ${token}`
                    }
                }
            );
             const loaded: SavedQuestion[] = [
          ...(response.data.quiz.questions ?? []),
        ].sort((a, b) => a.order - b.order);

            setQuizTitle(response.data.quiz.title);
            setQuestions(loaded);
            setCurrent(loaded.length);
            }
            catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || "Could not load quiz."
            : "Could not load quiz."
        );
      } finally {
        setPageLoading(false);
      }
    }

    if(quizId)
    {
        loadQuiz();
    }
    },[quizId,router]);

    function updateOption(index:number,value:string){
        setOptions((current)=>
            current.map((option,i)=>i===index?{...option,text:value}:option)
        )
    };
    function markCorrect(index:number)
    {
        setOptions((current)=>current.map((option,i)=>({
            ...option,isCorrect:i===index
        })));
    }

    function addOption(){
        if(options.length>6)
            return;

        setOptions((current)=>[
            ...current,
            {
                text:"",isCorrect:false
            }
        ]);
    }

    function removeOption(index:number){
        if(options.length<=2) return;

        setOptions((current)=>{
            const next= current.filter((_,i)=>i!==index);

            if(!next.some((option)=>option.isCorrect)){
                next[0].isCorrect=true;
            }
            return [...next];
        });
    }
      function goPrev() {
        setError("");
        setSuccess("");
        setCurrent((c) => Math.max(0, c - 1));
    }
    
    function goNext() {
        setError("");
        setSuccess("");
        setCurrent((c) => Math.min(questions.length, c + 1));
    }

    async function handleSaveQuestion(e:FormEvent<HTMLFormElement>){
        e.preventDefault();
        setError("");
        setSuccess("");

        const cleanedOptions=options.map((option)=>({
            ...option,
            text:option.text.trim(),
        }));

        if(!text.trim())
        {
            setError("please enter a question");
            return ;
        }
        if(cleanedOptions.some((option)=>!option.text))
        {
            setError("please fill in every option");
            return;
        }
        if(new Set(cleanedOptions.map((option)=>option.text.toLowerCase())).size!==cleanedOptions.length){
            setError("answer options must be unique");
            return;
        }
        if(!cleanedOptions.some((option)=>option.isCorrect))
        {
            setError("please select correct answer");
            return;
        }

        setLoading(true);

        try{
            const token= localStorage.getItem("token");
            if(!token)
            {
                router.replace("/login");
                return;
            }
            const response=await axios.post(`${HTTP_BACKEND}/quiz/${encodeURIComponent(quizId)}/questions`,
        {
            text:text.trim(),
            timeLimit,
            difficulty,
            options:cleanedOptions
        },
        {headers:{
            Authorization:`Bearer ${token}`
        }});
        const SavedQuestion= response.data.question;
        setQuestions((current)=>[...current,SavedQuestion]);
        setCurrent(questions.length+1);

        setText("");
        setTimeLimit(15);
        setDifficulty("EASY");
        setOptions([
            {text:"",isCorrect:true},
            {text:"",isCorrect:false}
        ]);

        setSuccess("question saved ,add net when you are ready");

        }
        catch(err)
        {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
        }
         setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Failed to save question."
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
    }

    const isNewQuestion = current >= questions.length;
  const viewing = isNewQuestion ? null : questions[current];
  const totalPages = questions.length + 1;
 
  return (
    <main
      className={`${font.className} flex min-h-screen flex-col bg-[#5c0f2b] px-5 py-6 text-[#ffc2d1] sm:px-12`}
    >
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[28px] font-extrabold tracking-[-0.04em] text-[#ffd24a] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
        >
          quizo
        </button>
 
        {/* Change this route later, e.g. to the host page for this quiz */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border-[3px] border-[#ffc2d1] px-5 py-2 text-base font-extrabold text-[#ffc2d1] transition hover:bg-[#ffc2d1] hover:text-[#43091f] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffc2d1]"
        >
          Done
        </button>
      </header>
 
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-8">
        {pageLoading ? (
          <p className="text-center text-xl font-bold">Loading your quiz...</p>
        ) : (
          <>
            <p className="text-sm font-extrabold uppercase tracking-widest text-[#ffd24a]">
              {quizTitle || "Your quiz"}
            </p>
            <h1 className="mb-6 mt-2 text-[clamp(32px,6vw,48px)] font-extrabold leading-none tracking-[-0.04em] text-[#fff5f7]">
              {isNewQuestion ? "Ask something good." : "Here's what you wrote."}
            </h1>
 
            <div className="rounded-[28px] border-[3px] border-[#43091f] bg-[#ffc2d1] p-6 text-[#43091f] shadow-[6px_6px_0_#ffd24a] sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-[#43091f] px-4 py-1.5 text-sm font-extrabold text-[#ffd24a]">
                  Question {current + 1}
                </span>
                <span className="text-sm font-extrabold">
                  {isNewQuestion ? "New" : "Saved"}
                </span>
              </div>
 
              {isNewQuestion ? (
                <form onSubmit={handleSaveQuestion} className="space-y-5">
                  <div>
                    <label
                      htmlFor="question"
                      className="mb-2 block text-sm font-extrabold"
                    >
                      Your question
                    </label>
                    <textarea
                      id="question"
                      rows={3}
                      placeholder="Type your question here..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className={`${fieldClass} resize-none text-lg`}
                    />
                  </div>
 
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="timeLimit"
                        className="mb-2 block text-sm font-extrabold"
                      >
                        Time (seconds)
                      </label>
                      <select
                        id="timeLimit"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                        className={fieldClass}
                      >
                        {[10, 15, 20, 30, 45, 60].map((seconds) => (
                          <option key={seconds} value={seconds}>
                            {seconds}s
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="difficulty"
                        className="mb-2 block text-sm font-extrabold"
                      >
                        Difficulty
                      </label>
                      <select
                        id="difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className={fieldClass}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>
 
                  <div>
                    <p className="mb-1 text-sm font-extrabold">Answer options</p>
                    <p className="mb-3 text-sm font-medium">
                      Tap the circle to mark the right answer.
                    </p>
 
                    <div className="space-y-3">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => markCorrect(index)}
                            aria-pressed={option.isCorrect}
                            aria-label={`Mark option ${index + 1} as the correct answer`}
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#43091f] text-xl font-extrabold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a] ${
                              option.isCorrect
                                ? "bg-[#ffd24a] text-[#43091f]"
                                : "bg-[#fff5f7] text-transparent hover:text-[#43091f]/30"
                            }`}
                          >
                            ✓
                          </button>
                          <input
                            type="text"
                            placeholder={`Option ${index + 1}`}
                            aria-label={`Option ${index + 1}`}
                            value={option.text}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className={fieldClass}
                          />
                          {options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              aria-label={`Remove option ${index + 1}`}
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-extrabold text-[#43091f]/60 transition hover:bg-[#43091f] hover:text-[#ffd24a] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a]"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
 
                    {options.length < 6 && (
                      <button
                        type="button"
                        onClick={addOption}
                        className="mt-4 rounded-full border-[3px] border-dashed border-[#43091f] px-5 py-2 text-sm font-extrabold transition hover:bg-[#43091f] hover:text-[#ffd24a] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#ffd24a]"
                      >
                        + Add option
                      </button>
                    )}
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
                    className="w-full rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-5 py-4 text-xl font-extrabold text-[#43091f] transition hover:-translate-y-0.5 hover:-rotate-1 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:rotate-0 motion-reduce:transition-none motion-reduce:hover:transform-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#43091f]"
                  >
                    {loading ? "Saving..." : "Save question"}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-2xl font-extrabold leading-tight">
                    {viewing?.text}
                  </p>
                  <ul className="space-y-3">
                    {(viewing?.options ?? []).map((option, index) => (
                      <li
                        key={index}
                        className={`flex items-center justify-between gap-3 rounded-2xl border-[3px] border-[#43091f] px-4 py-3 text-base font-bold ${
                          option.isCorrect ? "bg-[#ffd24a]" : "bg-[#fff5f7]"
                        }`}
                      >
                        <span>{option.text}</span>
                        {option.isCorrect && (
                          <span className="shrink-0 text-sm font-extrabold">
                            ✓ correct
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
 
            {!isNewQuestion && error && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border-[3px] border-[#43091f] bg-[#43091f] px-4 py-3 text-sm font-bold text-[#ffd24a]"
              >
                {error}
              </div>
            )}
 
            {success && (
              <div
                role="status"
                className="mt-5 rounded-2xl border-[3px] border-[#43091f] bg-[#ffd24a] px-4 py-3 text-sm font-extrabold text-[#43091f]"
              >
                {success}
              </div>
            )}
 
            {/* Previous / next arrows */}
            <nav
              aria-label="Question navigation"
              className="mt-8 flex items-center justify-center gap-6"
            >
              <button
                type="button"
                onClick={goPrev}
                disabled={current === 0}
                aria-label="Previous question"
                className={arrowClass}
              >
                ←
              </button>
              <span className="min-w-20 text-center text-lg font-extrabold text-[#fff5f7]">
                {current + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={isNewQuestion}
                aria-label="Next question"
                className={arrowClass}
              >
                →
              </button>
            </nav>
          </>
        )}
      </section>
    </main>
  );
}