import AddQuestions from "@/components/AddQuestions";
import { Suspense } from "react";

export default function Page({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading questions page...</div>}>
      <QuestionsContent params={params} />
    </Suspense>
  );
}

async function QuestionsContent({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  return <AddQuestions quizId={quizId} />;
}
