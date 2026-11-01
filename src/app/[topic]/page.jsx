import { TopicView } from 'src/sections/topic/topic-view';

// ----------------------------------------------------------------------

export default async function Page({ params }) {
  const { topic } = await params;
  return <TopicView slug={topic} />;
}
