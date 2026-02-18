'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';

import type { Game, Player, RPSChoice } from '@/types/game';
import { Button } from '@/components/ui/button';
import { submitRpsChoice } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Hand, Scissors, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '../ui/spinner';

type RpsChallengeProps = {
  game: Game;
  players: Player[];
  currentUser: User;
};

export default function RpsChallenge({ game, players, currentUser }: RpsChallengeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<RPSChoice | null>(null);
  const { toast } = useToast();

  const isDuelist = currentUser.uid === game.targetPlayerUid || currentUser.uid === game.namedPlayerUid;
  const hasChosen = game.rpsChoices && currentUser.uid in game.rpsChoices;

  const targetPlayer = players.find((p) => p.uid === game.targetPlayerUid);
  const namedPlayer = players.find((p) => p.uid === game.namedPlayerUid);

  const handleRpsSubmit = async (choice: RPSChoice) => {
    setSelectedChoice(choice);
    setIsLoading(true);
    const result = await submitRpsChoice(game.gameCode, currentUser.uid, choice);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setIsLoading(false);
    }
    // No need to set isLoading to false on success, as the component will re-render
  };

  const targetScore = game.rpsScores?.[game.targetPlayerUid || ''] || 0;
  const namedScore = game.rpsScores?.[game.namedPlayerUid || ''] || 0;

  const scoreDisplay = (
    <div className="text-2xl font-bold">
        <span>{targetPlayer?.displayName}: {targetScore}</span>
        <span className="mx-2">-</span>
        <span>{namedPlayer?.displayName}: {namedScore}</span>
    </div>
  );

  if (!isDuelist) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">
          Rock, Paper, Scissors!
        </h2>
        {scoreDisplay}
        <p className="text-muted-foreground">
          Best 2 out of 3. {targetPlayer?.displayName} and {namedPlayer?.displayName} are battling it out.
        </p>
        <Spinner className="mx-auto h-10 w-10 text-primary" />
      </div>
    );
  }

  if (hasChosen) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Waiting...</h2>
        {scoreDisplay}
        <p className="text-muted-foreground">
          You have made your choice. Waiting for the other player.
        </p>
        <div className="flex justify-center gap-4">
          <p>Your choice: {game.rpsChoices?.[currentUser.uid]}</p>
        </div>
        <Spinner className="mx-auto h-10 w-10 text-primary" />
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Choose Your Weapon!</h2>
      {scoreDisplay}
      <p className="text-muted-foreground">
        You are in a Rock, Paper, Scissors battle against {currentUser.uid === game.targetPlayerUid ? namedPlayer?.displayName : targetPlayer?.displayName}. Best 2 out of 3.
      </p>

      <div className="flex justify-center gap-4 sm:gap-8 pt-4">
        {(['rock', 'paper', 'scissors'] as RPSChoice[]).map((choice) => {
          const Icon = {
            rock: Hand,
            paper: FileText,
            scissors: Scissors,
          }[choice];

          return (
            <Button
              key={choice}
              variant="outline"
              size="lg"
              className={cn(
                'h-24 w-24 sm:h-32 sm:w-32 flex-col gap-2 transition-all',
                selectedChoice === choice && 'ring-4 ring-primary ring-offset-2'
              )}
              onClick={() => handleRpsSubmit(choice)}
              disabled={isLoading}
            >
              <Icon className="h-10 w-10" />
              <span className="text-lg font-semibold capitalize">{choice}</span>
            </Button>
          );
        })}
      </div>
      {isLoading && <Spinner className="mx-auto mt-4" />}
    </div>
  );
}
