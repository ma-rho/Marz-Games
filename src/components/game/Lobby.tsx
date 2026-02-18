'use client';

import { useState } from 'react';
import { Copy, PartyPopper } from 'lucide-react';
import { User } from 'firebase/auth';

import type { Game, Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import PlayerList from './PlayerList';
import { startGame } from '@/app/actions';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';

interface LobbyProps {
  game: Game;
  players: Player[];
  currentUser: User;
}

export default function Lobby({ game, players, currentUser }: LobbyProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isLeader = currentUser.uid === game.leaderId;

  const handleStartGame = async () => {
    setIsLoading(true);
    if (players.length < 4) {
      toast({
        variant: 'destructive',
        title: 'Not enough players',
        description: 'You need at least 4 players to start the game.',
      });
      setIsLoading(false);
      return;
    }
    const result = await startGame(game.gameCode, currentUser.uid);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error starting game',
        description: result.error,
      });
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(game.gameCode).then(() => {
      toast({ title: 'Game code copied!' });
    }).catch(err => {
      toast({ 
        variant: 'destructive',
        title: 'Copy failed', 
        description: 'Please copy the code manually.' 
      });
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Game Lobby</h2>
        <p className="text-muted-foreground">
          Waiting for the leader to start the game...
        </p>
      </div>

      <Alert className="bg-primary/10 border-primary/20">
        <PartyPopper className="h-4 w-4" />
        <AlertTitle>Invite your friends!</AlertTitle>
        <AlertDescription className="flex items-center gap-4 mt-2">
          <Input readOnly value={game.gameCode} className="text-lg font-mono tracking-widest bg-background/50" />
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            <Copy className="h-5 w-5" />
          </Button>
        </AlertDescription>
      </Alert>

      <PlayerList players={players} game={game} />

      {isLeader && (
        <div className="text-center">
          <Button onClick={handleStartGame} disabled={isLoading || players.length < 4} size="lg">
            {isLoading ? <Spinner /> : `Start Game with ${players.length} players`}
          </Button>
          {players.length < 4 && <p className="text-sm text-muted-foreground mt-2">You need at least 4 players to start.</p>}
        </div>
      )}
    </div>
  );
}
