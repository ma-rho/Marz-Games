'use client';

import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import { type User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import type { Game, Player, PrivateData } from '@/types/game';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (error) {
          console.error('Error signing in anonymously:', error);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

export function useGame(gameCode: string, user: User | null) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameCode || !user) return;

    const gameRef = doc(db, 'games', gameCode);
    const unsubscribe = onSnapshot(
      gameRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setGame({ id: docSnap.id, ...docSnap.data() } as Game);
          setError(null);
        } else {
          setError('Game not found.');
          setGame(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching game:', err);
        if (err.code === 'permission-denied') {
          setError('You do not have permission to view this game.');
        } else {
          setError('Failed to load game data.');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameCode, user]);

  return { game, loading, error };
}

export function usePlayers(gameCode: string) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameCode) return;

    const playersQuery = query(
      collection(db, 'games', gameCode, 'players'),
      orderBy('orderIndex', 'asc')
    );
    const unsubscribe = onSnapshot(
      playersQuery,
      (querySnapshot) => {
        const playersData = querySnapshot.docs.map(
          (doc) => doc.data() as Player
        );
        setPlayers(playersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching players:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameCode]);

  return { players, loading };
}

export function usePrivateData(gameCode: string) {
  const [privateData, setPrivateData] = useState<PrivateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameCode) return;

    const privateRef = doc(db, 'games', gameCode, 'private', 'data');
    const unsubscribe = onSnapshot(
      privateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setPrivateData(docSnap.data() as PrivateData);
        } else {
          setPrivateData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching private data:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameCode]);

  return { privateData, loading };
}

export function usePlayerPresence(gameCode: string, user: User | null) {
  useEffect(() => {
    if (!user || !gameCode) return;

    const playerRef = doc(db, 'games', gameCode, 'players', user.uid);

    // Set player to online when the hook mounts
    updateDoc(playerRef, { isOnline: true }).catch((e) => {
        console.info("Player isn't in the game yet. They will be marked as online when they join.");
    });

    // Set player to offline when the hook unmounts
    return () => {
      updateDoc(playerRef, { isOnline: false }).catch(console.error);
    };
  }, [user, gameCode]);
}
