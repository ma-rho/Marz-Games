import GameClient from './game-client';

type GamePageProps = {
  params: {
    gameCode: string;
  };
};

export default function GamePage({ params }: GamePageProps) {
  const gameCode = params.gameCode.toUpperCase();

  // The GameClient component will handle all fetching, loading, and error states.
  return <GameClient gameCode={gameCode} />;
}
