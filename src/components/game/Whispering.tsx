'use client';

import type { Game, Player, PrivateData } from '@/types/game';
import type { User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import PlayerList from './PlayerList';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitQuestion } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '../ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Megaphone, HelpCircle } from 'lucide-react';

type WhisperingProps = {
  game: Game;
  players: Player[];
  currentUser: User;
  privateData: PrivateData | null;
};

export default function Whispering({
  game,
  players,
  currentUser,
  privateData,
}: WhisperingProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | undefined>();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isActivePlayer = currentUser.uid === game.activeTurnUid;
  const activePlayer = players.find((p) => p.uid === game.activeTurnUid);

  useEffect(() => {
    if (isActivePlayer && privateData?.currentQuestion) {
      setQuestion(privateData.currentQuestion);
    }
  }, [isActivePlayer, privateData?.currentQuestion]);

  const handleSubmit = async () => {
    if (!selectedPlayer || !question) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select a player and write a question.',
      });
      return;
    }
    setIsLoading(true);
    const result = await submitQuestion(
      game.gameCode,
      currentUser.uid,
      selectedPlayer,
      question
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

  const selectableUids = players
    .filter((p) => p.uid !== currentUser.uid)
    .map((p) => p.uid);

  if (isActivePlayer) {
    return (
      <div className="space-y-6">
        {privateData?.currentDare && game.dareTargetName && (
          <Alert>
            <Megaphone className="h-4 w-4" />
            <AlertTitle>Last Round's Dare!</AlertTitle>
            <AlertDescription>
              {game.dareTargetName} was dared to: "{privateData.currentDare}"
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Your Turn!</h2>
          <p className="text-muted-foreground">
            Ask a secret question about one of the other players.
          </p>
        </div>

        <PlayerList
          players={players}
          game={game}
          onPlayerSelect={setSelectedPlayer}
          selectableUids={selectableUids}
          selectedUid={selectedPlayer}
          title="1. Choose a player the question is about"
        />

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">2. Write the question (a who question)</h3>
           <p className="text-sm text-muted-foreground">You can edit the question before sending it, but it may be revealed later!</p>
          <Textarea
            placeholder="e.g., Who is most likely to survive a zombie apocalypse?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="text-base"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full" size="lg">
          {isLoading ? <Spinner /> : 'Send Question to the Player'}
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-8">
      {privateData?.currentDare && game.dareTargetName && (
        <Alert className='text-left mb-6'>
          <Megaphone className="h-4 w-4" />
          <AlertTitle>Last Round's Dare!</AlertTitle>
          <AlertDescription>
            {game.dareTargetName} was dared to: "{privateData.currentDare}"
          </AlertDescription>
        </Alert>
      )}
      <Spinner className="mx-auto h-10 w-10 text-primary" />
      <h2 className="text-2xl font-bold">Whispering in Progress...</h2>
      <p className="text-muted-foreground">
        Waiting for {activePlayer?.displayName || '...'} to ask a question.
      </p>
    </div>
  );
}
