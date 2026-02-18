'use client';

import type { Game, Player, PrivateData } from '@/types/game';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { nextRoundAfterReveal } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Spinner } from '../ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Lightbulb, Forward } from 'lucide-react';

type RevealQuestionProps = {
  game: Game;
  players: Player[];
  currentUser: User;
  privateData: PrivateData | null;
};

export default function RevealQuestion({ game, players, currentUser, privateData }: RevealQuestionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isLeader = currentUser.uid === game.leaderId;
  const namedPlayer = players.find(p => p.uid === game.namedPlayerUid);

  const handleNextRound = async () => {
    if (!game.activeTurnUid) {
        console.error("Cannot start next round without an active turn UID.");
        toast({ variant: 'destructive', title: 'Error', description: 'Could not determine the current player to start the next round.' });
        return;
    }
    setIsLoading(true);
    const result = await nextRoundAfterReveal(game.gameCode, game.activeTurnUid);
     if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center space-y-6">
        <Lightbulb className="mx-auto h-16 w-16 text-yellow-400" />
        <h2 className="text-3xl font-bold">The Question is Revealed!</h2>
        
        <Alert className="text-left">
            <AlertTitle>The question about <span className="font-bold text-primary">{namedPlayer?.displayName || '...'}</span> was:</AlertTitle>
            <AlertDescription className="text-2xl font-semibold pt-2">
                "{privateData?.currentQuestion || '...'}"
            </AlertDescription>
        </Alert>

      {isLeader ? (
        <Button onClick={handleNextRound} disabled={isLoading} size="lg">
          {isLoading ? <Spinner /> : <>Next Round <Forward className="ml-2 h-4 w-4" /></>}
        </Button>
      ) : (
         <div className="text-center p-8">
            <Spinner /> <p className="mt-2">Waiting for the leader to start the next round...</p>
         </div>
      )}
    </div>
  );
}
