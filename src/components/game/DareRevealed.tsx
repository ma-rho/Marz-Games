'use client';

import type { Game, Player, PrivateData } from '@/types/game';
import type { User } from 'firebase/auth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { acknowledgeDare } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '../ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type DareRevealedProps = {
  game: Game;
  players: Player[];
  currentUser: User;
  privateData: PrivateData | null;
};

export default function DareRevealed({ game, players, currentUser, privateData }: DareRevealedProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isAsker = currentUser.uid === game.activeTurnUid;
  const isTarget = currentUser.uid === game.targetPlayerUid;

  const handleAcknowledge = async () => {
    setIsLoading(true);
    if (!game.activeTurnUid) {
      toast({ variant: 'destructive', title: 'Error', description: 'Game state is invalid.' });
      setIsLoading(false);
      return;
    }
    const result = await acknowledgeDare(game.gameCode, game.activeTurnUid);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsLoading(false);
    }
  };

  const asker = players.find((p) => p.uid === game.activeTurnUid);
  const target = players.find((p) => p.uid === game.targetPlayerUid);

  if (isAsker || isTarget) {
    return (
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-destructive">
          {target?.displayName} has been DARED!
        </h2>
        <Alert>
          <AlertTitle className="text-lg">The Dare from {asker?.displayName}:</AlertTitle>
          <AlertDescription className="text-xl font-semibold pt-1">
            &ldquo;{privateData?.currentDare || '...'}&rdquo;
          </AlertDescription>
        </Alert>

        {isTarget && <p className="text-muted-foreground">Do the dare! Then the asker will confirm.</p>}

        {isAsker && (
          <Button onClick={handleAcknowledge} disabled={isLoading} size="lg">
            {isLoading ? <Spinner /> : 'Done! Go to Next Round'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-8">
      <Spinner className="mx-auto h-10 w-10 text-primary" />
      <h2 className="text-2xl font-bold">The Dare is Revealed!</h2>
      <p className="text-muted-foreground">
        {game.dareTargetName} was dared to: &ldquo;{privateData?.currentDare || '...'}&rdquo;
      </p>
    </div>
  );
}
