'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Ghost, LogIn, PlusCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-game-state';
import { doc, runTransaction, Timestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Game, Player } from '@/types/game';

const joinGameSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
  gameCode: z
    .string()
    .length(6, 'Game code must be 6 characters.')
    .regex(/^[A-Z0-9]+$/, 'Game code must be uppercase letters and numbers.'),
});

const createGameSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
});

function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const joinForm = useForm<z.infer<typeof joinGameSchema>>({
    resolver: zodResolver(joinGameSchema),
    defaultValues: {
      displayName: '',
      gameCode: '',
    },
  });

  const createForm = useForm<z.infer<typeof createGameSchema>>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      displayName: '',
    },
  });

  async function onJoin(values: z.infer<typeof joinGameSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Please wait a moment and try again.',
      });
      return;
    }
    setIsJoining(true);
    try {
      await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'games', values.gameCode);
        const gameSnap = await transaction.get(gameRef);

        if (!gameSnap.exists()) {
          throw new Error('Game not found. Please check the code and try again.');
        }

        const gameData = gameSnap.data() as Game;
        if (gameData.status !== 'LOBBY') {
          throw new Error('This game has already started.');
        }
        
        const playersRef = collection(db, 'games', values.gameCode, 'players');
        const playersSnap = await getDocs(playersRef);
        if (playersSnap.size >= 9) {
          throw new Error('This game is full.');
        }

        const playerRef = doc(db, 'games', values.gameCode, 'players', user.uid);
        const playerSnap = await transaction.get(playerRef);
        if (playerSnap.exists()) {
          return;
        }

        const newPlayer: Player = {
          uid: user.uid,
          displayName: values.displayName,
          isOnline: true,
          orderIndex: playersSnap.size,
        };

        transaction.set(playerRef, newPlayer);
      });

      localStorage.setItem(`displayName-${values.gameCode}`, values.displayName);
      router.push(`/game/${values.gameCode}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Join Game',
        description: error.message || 'An unknown error occurred.',
      });
      setIsJoining(false);
    }
  }

  async function onCreate(values: z.infer<typeof createGameSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not ready yet',
        description: 'Authenticating... Please try again in a moment.',
      });
      return;
    }
    setIsCreating(true);
    const gameCode = generateGameCode();
    try {
      await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'games', gameCode);

        const newGame: Omit<Game, 'id'> = {
          gameCode,
          status: 'LOBBY',
          leaderId: user.uid,
          playerCount: 1,
          lastUpdated: Timestamp.now(),
        };
        transaction.set(gameRef, newGame);

        const playerRef = doc(db, 'games', gameCode, 'players', user.uid);
        const newPlayer: Player = {
          uid: user.uid,
          displayName: values.displayName,
          isOnline: true,
          orderIndex: 0,
        };
        transaction.set(playerRef, newPlayer);
      });
      localStorage.setItem(`displayName-${gameCode}`, values.displayName);
      router.push(`/game/${gameCode}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to create game',
        description: error.message || 'An unknown error occurred.',
      });
      setIsCreating(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="text-center mb-10">
        <h1 className="text-6xl font-bold text-primary tracking-tighter flex items-center justify-center gap-4">
          <Ghost size={60} />
          Paranoia
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          The party game of secrets and suspicion.
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle /> Create a New Game
            </CardTitle>
            <CardDescription>
              Start a new session and invite your friends.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreate)}
                className="space-y-6"
              >
                <FormField
                  control={createForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your display name"
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isCreating || authLoading}
                >
                  {isCreating || authLoading ? <Spinner /> : 'Create Game'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn /> Join an Existing Game
            </CardTitle>
            <CardDescription>
              Enter a game code to join the party.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...joinForm}>
              <form
                onSubmit={joinForm.handleSubmit(onJoin)}
                className="space-y-6"
              >
                <FormField
                  control={joinForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your display name"
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={joinForm.control}
                  name="gameCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC123"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                          className="text-base tracking-widest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isJoining || authLoading}
                >
                  {isJoining || authLoading ? <Spinner /> : 'Join Game'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>
          How to play: One player asks a \"Who...\" question to another player in
          secret. The second player answers by naming a player. The named player
          can then choose to \"drink\" to reveal the question.
        </p>
      </footer>
    </main>
  );
}
