'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';

import type { Game, Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { revealQuestion, nextRound } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, SkipForward } from 'lucide-react';
import { Spinner } from '../ui/spinner';

type LeaderDecisionProps = {
  game: Game;
  players: Player[];
  currentUser: User;
};

export default function LeaderDecision({ game, players, currentUser }: LeaderDecisionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isLeader = currentUser.uid === game.leaderId;
  const rpsWinner = players.find((p) => p.uid === game.rpsWinnerUid);

  const handleReveal = async () => {
    setIsLoading(true);
    const result = await revealQuestion(game.gameCode);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    if (!game.activeTurnUid) return; // Should not happen
    const result = await nextRound(game.gameCode, game.activeTurnUid);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsLoading(false);
    }
  };

  if (!isLeader) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">The Leader is Deciding...</h2>
        <p className="text-muted-foreground">
          {rpsWinner?.displayName} won the Rock-Paper-Scissors battle!
        </p>
        <p className="text-muted-foreground">
          The leader will now decide whether to reveal the question or skip to the next round.
        </p>
        <Spinner className="mx-auto h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">You are the Leader!</h2>
      <p className="text-2xl font-semibold text-primary">
        {rpsWinner?.displayName} won the Rock-Paper-Scissors battle!
      </p>
      <p className="text-muted-foreground">
        You have the power to either reveal the original question or skip to the next round.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <Button
          onClick={handleReveal}
          disabled={isLoading}
          className="w-full sm:w-auto"
          size="lg"
        >
          <ShieldCheck className="mr-2 h-5 w-5" />
          Reveal the Question
        </Button>
        <Button
          onClick={handleSkip}
          disabled={isLoading}
          variant="secondary"
          className="w-full sm:w-auto"
          size="lg"
        >
          <SkipForward className="mr-2 h-5 w-5" />
          Skip to Next Round
        </Button>
      </div>
      {isLoading && <Spinner className="mx-auto mt-4" />}
    </div>
  );
}
