   import { Suspense } from "react";
   import PlayQuiz from "@/components/PlayQuiz";

   type Props = { params: Promise<{ joinCode: string }> };

   async function PlayContent({ params }: Props) {
     const { joinCode } = await params;
     return <PlayQuiz joinCode={joinCode} />;
   }

   export default function Page({ params }: Props) {
     return (
       <Suspense fallback={<main className="min-h-screen bg-[#5c0f2b]" />}>
         <PlayContent params={params} />
       </Suspense>
     );
   }