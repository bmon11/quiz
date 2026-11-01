import { QuizScreen } from 'src/sections/quiz/quiz-screen';

// ----------------------------------------------------------------------

export default async function Page({ params, searchParams }) {
  const { topic } = await params;
  const { lesson } = await searchParams;
  return <QuizScreen slug={topic} lessonKey={lesson ?? null} />;
}
