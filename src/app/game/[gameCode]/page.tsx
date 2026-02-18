import GameClient from './game-client';

type GamePageProps = {
  params: Promise<{ gameCode: string }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { gameCode } = await params;

  // The GameClient component will handle all fetching, loading, and error states.
  return <GameClient gameCode={gameCode.toUpperCase()} />;
}
