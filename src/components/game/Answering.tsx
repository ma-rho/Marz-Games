'use client';

import { Game, Player, PrivateData } from '@/types/game';
import { User } from 'firebase/auth';
import { useState } from 'react';
import PlayerList from './PlayerList';
import { Button } from '@/components/ui/button';
import { passAndInitiateDare, submitAnswer } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '../ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { HelpCircle } from 'lucide-react';

type AnsweringProps = {
  game: Game;
  players: Player[];
  currentUser: User;
  privateData: PrivateData | null;
};

export default function Answering({
  game,
  players,
  currentUser,
  privateData,
}: AnsweringProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'submit' | 'pass' | null>(null);
  const { toast } = useToast();

  const isTargetPlayer = currentUser.uid === game.targetPlayerUid;
  const targetPlayer = players.find((p) => p.uid === game.targetPlayerUid);

  const handleSubmit = async () => {
    if (!selectedPlayer) {
      toast({
        variant: 'destructive',
        title: 'No player selected',
        description: 'Please choose a player who fits the description.',
      });
      return;
    }
    setIsLoading(true);
    setAction('submit');
    const result = await submitAnswer(game.gameCode, selectedPlayer);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setIsLoading(false);
    }
  };

  const handlePass = async () => {
    setIsLoading(true);
    setAction('pass');
    const result = await passAndInitiateDare(game.gameCode);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setIsLoading(false);
    }
  };

  if (isTargetPlayer) {
    if (!privateData) {
      return (
        <div className="text-center p-8">
          <Spinner /> <p className="mt-2">Loading question...</p>
        </div>
      );
    }
    // This is the corrected filter logic
    const selectableUids = players
      .filter((p) => p.uid !== currentUser.uid)
      .map((p) => p.uid);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            You've Got a Question!
          </h2>
          <p className="text-muted-foreground">
            Read the secret question and choose who it describes. Or pass.
          </p>
        </div>

        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertTitle className="text-lg">The secret question is:</AlertTitle>
          <AlertDescription className="text-base font-semibold pt-2">
            "{privateData.currentQuestion}"
          </AlertDescription>
        </Alert>

        <PlayerList
          players={players}
          game={game}
          onPlayerSelect={setSelectedPlayer}
          selectableUids={selectableUids}
          selectedUid={selectedPlayer}
          title="Who is it?"
        />

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handlePass} disabled={isLoading} variant="outline">
            {isLoading && action === 'pass' ? <Spinner /> : 'Pass (and take a dare)'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedPlayer}
          >
            {isLoading && action === 'submit' ? <Spinner /> : 'Submit Your Answer'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-8">
      <Spinner className="mx-auto h-10 w-10 text-primary" />
      <h2 className="text-2xl font-bold">Deliberation...</h2>
      <p className="text-muted-foreground">
        Waiting for {targetPlayer?.displayName || '...'} to answer the secret
        question.
      </p>
    </div>
  );
}
