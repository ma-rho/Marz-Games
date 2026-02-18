'use client';

import type { Game, Player, PrivateData } from '@/types/game';
import type { User } from 'firebase/auth';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitDare } from '@/app/actions';
import { Spinner } from '../ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type DareProps = {
  game: Game;
  players: Player[];
  currentUser: User;
  privateData: PrivateData | null;
};

export default function Dare({ game, players, currentUser, privateData }: DareProps) {
  const [dare, setDare] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isAsker = currentUser.uid === game.activeTurnUid;
  const targetPlayer = players.find((p) => p.uid === game.targetPlayerUid);

  const handleSubmit = async () => {
    if (!dare.trim()) {
      toast({
        variant: 'destructive',
        title: 'No dare entered',
        description: 'You must provide a dare.',
      });
      return;
    }
    if (!game.activeTurnUid || !targetPlayer) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Game state is invalid. Cannot submit dare.',
      });
      return;
    }

    setIsLoading(true);
    const result = await submitDare(
      game.gameCode,
      dare,
      game.activeTurnUid,
      targetPlayer.displayName
    );
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setIsLoading(false);
    }
  };

  if (isAsker) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {targetPlayer?.displayName} Passed!
          </h2>
          <p className="text-muted-foreground">
            They passed on your question. Now, give them a dare.
          </p>
        </div>

        <Alert>
          <AlertTitle>The Question They Passed On</AlertTitle>
          <AlertDescription className="pt-1">
            &ldquo;{privateData?.currentQuestion || '...'}&rdquo;
          </AlertDescription>
        </Alert>

        <Textarea
          value={dare}
          onChange={(e) => setDare(e.target.value)}
          placeholder={`e.g., \"Sing a song\", \"Do 10 push-ups\", etc.`}
          className="text-lg"
          rows={3}
        />

        <Button onClick={handleSubmit} disabled={isLoading || !dare.trim()} className="w-full" size="lg">
          {isLoading ? <Spinner /> : 'Submit Dare'}
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-8">
      <Spinner className="mx-auto h-10 w-10 text-primary" />
      <h2 className="text-2xl font-bold">A Dare is Being Decided...</h2>
      <p className="text-muted-foreground">
        {targetPlayer?.displayName} passed on the question. Now, the asker is giving them a dare.
      </p>
    </div>
  );
}
