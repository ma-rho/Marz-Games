'use client';

import { Game, Player } from '@/types/game';
import { User } from 'firebase/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, LogOut, Users, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { endGame } from '@/app/actions';
import { useRouter } from 'next/navigation';

type GameHeaderProps = {
  game: Game;
  players: Player[];
  currentUser: User;
};

export default function GameHeader({
  game,
  players,
  currentUser,
}: GameHeaderProps) {
  const { toast } = useToast();
  const router = useRouter();
  const isLeader = game.leaderId === currentUser.uid;

  const copyGameCode = () => {
    navigator.clipboard.writeText(game.gameCode);
    toast({
      title: 'Copied to clipboard!',
      description: `Game code ${game.gameCode} is ready to share.`,
    });
  };

  const handleEndGame = async () => {
    const result = await endGame(game.gameCode);
    if(result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Game Ended', description: 'The game session has been closed.'});
        // The page will update to ENDED state via Firestore listener
    }
  };
  
  const handleLeaveGame = () => {
    router.push('/');
  }

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Paranoia</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Code: {game.gameCode}
            </Badge>
            <Button size="icon" variant="ghost" onClick={copyGameCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> {players.length}
          </Badge>
           <Button size="icon" variant="ghost" onClick={handleLeaveGame} title="Leave Game">
              <LogOut className="h-4 w-4" />
            </Button>
          {isLeader && game.status !== 'ENDED' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="destructive" title="End Game">
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently end the game for everyone. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndGame}>
                    End Game
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </header>
  );
}
