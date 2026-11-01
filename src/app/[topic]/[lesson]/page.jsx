import { LessonView } from 'src/sections/lesson/lesson-view';

// ----------------------------------------------------------------------

export default async function Page({ params }) {
  const { topic, lesson } = await params;
  return <LessonView slug={topic} lessonName={decodeURIComponent(lesson)} />;
}
