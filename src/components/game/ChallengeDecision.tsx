'use client';

import type { Game, Player, PrivateData } from '@/types/game';
import type { User } from 'firebase/auth';
import { useState } from 'react';
import { handleChallengeDecision } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldQuestion } from 'lucide-react';

type ChallengeDecisionProps = {
  game: Game;
  players: Player[];
  currentUser: User;
  privateData: PrivateData | null; // Keep for other states, though not used by decider here
};

export default function ChallengeDecision({
  game,
  players,
  currentUser,
}: ChallengeDecisionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // The player who answered the question and pointed at someone
  const targetPlayer = players.find((p) => p.uid === game.targetPlayerUid);
  // The player who was named as the answer to the question
  const namedPlayer = players.find((p) => p.uid === game.namedPlayerUid);
  // The decision maker is the player who was named
  const isNamedPlayer = currentUser.uid === game.namedPlayerUid;

  const makeDecision = async (shouldChallenge: boolean) => {
    setIsLoading(true);
    const result = await handleChallengeDecision(game.gameCode, shouldChallenge);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setIsLoading(false);
    }
  };

  if (isNamedPlayer) {
    return (
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Your Decision</h2>
        <Alert variant="default">
            <ShieldQuestion className="h-4 w-4" />
            <AlertTitle>You've Been Named!</AlertTitle>
            <AlertDescription>
                <p className="text-lg mt-2">
                    <span className="font-semibold">{targetPlayer?.displayName || 'Someone'}</span> answered a secret question and said the answer was you!
                </p>
            </AlertDescription>
        </Alert>

        <p className="text-muted-foreground">
          Do you want to challenge them to reveal the question? If you win the Rock, Paper, Scissors duel, the question is revealed and you get to dare them. If you lose, they get to dare you. If you let it slide, the game continues and the question remains a secret.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => makeDecision(true)}
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading ? <Spinner /> : 'Challenge!'}
          </Button>
          <Button
            onClick={() => makeDecision(false)}
            disabled={isLoading}
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading ? <Spinner /> : 'Let it Slide'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-8">
      <Spinner className="mx-auto h-10 w-10 text-primary" />
      <h2 className="text-2xl font-bold">Awaiting Decision...</h2>
      <p className="text-muted-foreground">
        <span className="font-bold">{namedPlayer?.displayName || 'Someone'}</span> is deciding whether to challenge <span className="font-bold">{targetPlayer?.displayName || 'the one who answered'}</span>.
      </p>
    </div>
  );
}
