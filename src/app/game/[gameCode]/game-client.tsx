'use client';

import { useEffect, useState } from 'react';
import { useAuth, useGame, usePlayers, usePlayerPresence } from '@/hooks/use-game-state';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PrivateData } from '@/types/game';

import { Spinner } from '@/components/ui/spinner';
import GameHeader from '@/components/game/GameHeader';
import Lobby from '@/components/game/Lobby';
import Whispering from '@/components/game/Whispering';
import Answering from '@/components/game/Answering';
import ChallengeDecision from '@/components/game/ChallengeDecision';
import RevealQuestion from '@/components/game/RevealQuestion'; // Corrected import
import Dare from '@/components/game/Dare';
import DareRevealed from '@/components/game/DareRevealed';
import RpsChallenge from '@/components/game/RpsChallenge';
import LeaderDecision from '@/components/game/LeaderDecision';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function GameClient({ gameCode }: { gameCode: string }) {
  const { user, loading: authLoading } = useAuth();
  const { game, loading: gameLoading, error: gameError } = useGame(gameCode, user);
  const { players, loading: playersLoading } = usePlayers(gameCode);
  const [privateData, setPrivateData] = useState<PrivateData | null>(null);
  const [privateDataLoading, setPrivateDataLoading] = useState(true);
  const router = useRouter();

  usePlayerPresence(gameCode, user);

  useEffect(() => {
    if (!user || !game) {
      setPrivateDataLoading(false);
      return;
    }

    const privateDataRef = doc(db, 'games', gameCode, 'private', 'data');
    setPrivateDataLoading(true);

    const unsubscribe = onSnapshot(privateDataRef, 
      (doc) => {
        if (doc.exists()) {
          setPrivateData(doc.data() as PrivateData);
        } else {
          setPrivateData(null);
        }
        setPrivateDataLoading(false);
      },
      (error) => {
        setPrivateData(null);
        setPrivateDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [game, user, gameCode]);

  useEffect(() => {
    if (!authLoading && gameError) {
      router.push('/');
    }
  }, [authLoading, gameError, router]);

  const isLoading = authLoading || gameLoading || playersLoading || (game?.status !== 'LOBBY' && privateDataLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{gameError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!game || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  const currentUserPlayer = players.find((p) => p.uid === user.uid);

  const renderGameState = () => {
    switch (game.status) {
      case 'LOBBY':
        return <Lobby game={game} players={players} currentUser={user} />;
      case 'WHISPERING':
        return <Whispering game={game} players={players} currentUser={user} privateData={privateData} />;
      case 'ANSWERING':
        return <Answering game={game} players={players} currentUser={user} privateData={privateData} />;
      case 'CHALLENGE_DECISION':
        return <ChallengeDecision game={game} players={players} currentUser={user} privateData={privateData} />;
      case 'RPS_CHALLENGE':
        return <RpsChallenge game={game} players={players} currentUser={user} />;
      case 'LEADER_DECISION':
        return <LeaderDecision game={game} players={players} currentUser={user} />;
      case 'REVEAL_QUESTION': // Corrected case
        return <RevealQuestion game={game} players={players} currentUser={user} privateData={privateData} />;
      case 'DARE':
        return <Dare game={game} players={players} currentUser={user} privateData={privateData} />;
      case 'DARE_REVEALED':
        return <DareRevealed game={game} players={players} currentUser={user} privateData={privateData} />;
      case 'ENDED':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Game Over</h2>
            <p>The leader has ended the game.</p>
          </div>
        );
      default:
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-destructive">Error: Unknown Game State</h2>
                <p className="text-muted-foreground">The game has entered a state that the application does not recognize.</p>
                <p className="text-sm text-muted-foreground mt-2">Current state: {game.status}</p>
            </div>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 min-h-screen flex flex-col">
      <GameHeader game={game} players={players} currentUser={user} />
      <main className="flex-grow flex items-center justify-center">
        <Card className="w-full bg-card/70 backdrop-blur-sm shadow-2xl shadow-primary/10">
          <CardContent className="p-4 sm:p-8">
            {currentUserPlayer ? (
              renderGameState()
            ) : (
              <div className="text-center p-8">
                <Spinner /> <p className="mt-2">Joining game...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
