import AddQuestions from "@/components/AddQuestions";
import QuestionsPage from "@/components/AddQuestions";

export default async function Page({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {

    const {quizId}= await params;
  return <AddQuestions quizId={quizId}/>;
}