import { TournamentQuizScreen } from 'src/sections/tournament/tournament-view';

// ----------------------------------------------------------------------

export default async function Page({ searchParams }) {
  const { lesson } = await searchParams;
  return <TournamentQuizScreen deckKey={lesson ?? null} />;
}
