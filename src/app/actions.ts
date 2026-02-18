'use server';

import { revalidatePath } from 'next/cache';
import { adminDb as firestore } from '@/lib/firebaseAdmin';
import { FieldValue, Transaction } from 'firebase-admin/firestore';

// Helper to recursively delete a collection in batches
async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = firestore.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve, reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void, reject: (reason?: any) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve(true);
        return;
    }

    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(query, resolve, reject);
    });
}

// Helper function to get a random question from the database
async function getRandomQuestion() {
  const questionsSnapshot = await firestore.collection('questions').get();
  if (questionsSnapshot.empty) {
    return 'Is water wet?'; // Fallback question
  }
  const randomIndex = Math.floor(Math.random() * questionsSnapshot.docs.length);
  return questionsSnapshot.docs[randomIndex].data().text as string;
}

// Helper to get the next player's UID in the turn order
async function getNextPlayerUid(gameCode: string, currentUid: string): Promise<string> {
    const playersQuery = firestore.collection(`games/${gameCode}/players`).orderBy('orderIndex', 'asc');
    const playersSnap = await playersQuery.get();
    const players = playersSnap.docs.map(p => p.data());
    const currentIndex = players.findIndex(p => p.uid === currentUid);
    const nextPlayer = players[(currentIndex + 1) % players.length];
    return nextPlayer.uid;
}

export async function submitQuestion(
  gameCode: string,
  activeTurnUid: string,
  targetPlayerUid: string,
  question: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const gameRef = firestore.doc(`games/${gameCode}`);
    const privateDataRef = firestore.doc(`games/${gameCode}/private/data`);

    await firestore.runTransaction(async (transaction: Transaction) => {
      transaction.set(privateDataRef, { currentQuestion: question, targetPlayerUid: targetPlayerUid }, { merge: true });
      transaction.update(gameRef, {
        status: 'ANSWERING',
        targetPlayerUid: targetPlayerUid,
      });
    });

    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error submitting question:', error);
    return { success: false, error: 'Failed to submit question. Please try again.' };
  }
}

export async function submitAnswer(gameCode: string, namedPlayerUid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const gameRef = firestore.doc(`games/${gameCode}`);
    await gameRef.update({
      status: 'CHALLENGE_DECISION',
      namedPlayerUid: namedPlayerUid,
    });
    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error submitting answer:', error);
    return { success: false, error: 'Failed to submit answer. Please try again.' };
  }
}

export async function passAndInitiateDare(gameCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const gameRef = firestore.doc(`games/${gameCode}`);
    await gameRef.update({ status: 'DARE' });
    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error passing and initiating dare:', error);
    return { success: false, error: 'Failed to pass turn. Please try again.' };
  }
}

export async function submitDare(gameCode: string, dareText: string, askerUid: string, targetName: string): Promise<{ success: boolean; error?: string }> {
    try {
        const gameRef = firestore.doc(`games/${gameCode}`);
        const privateRef = firestore.doc(`games/${gameCode}/private/data`);

        await firestore.runTransaction(async (transaction: Transaction) => {
            transaction.set(privateRef, { currentDare: dareText }, { merge: true });
            transaction.update(gameRef, {
                status: 'DARE_REVEALED',
                dareInitiatorUid: askerUid,
                dareTargetName: targetName, 
            });
        });

        revalidatePath(`/game/${gameCode}`);
        return { success: true };
    } catch (error) {
        console.error('Error submitting dare:', error);
        return { success: false, error: 'Failed to submit dare. Please try again.' };
    }
}

export async function acknowledgeDare(gameCode: string, activeTurnUid: string): Promise<{ success: boolean; error?: string }> {
    try {
        const nextPlayerUid = await getNextPlayerUid(gameCode, activeTurnUid);
        const gameRef = firestore.doc(`games/${gameCode}`);
        const privateRef = firestore.doc(`games/${gameCode}/private/data`);
        const newQuestion = await getRandomQuestion();

        await firestore.runTransaction(async (transaction: Transaction) => {
            const privateDoc = await transaction.get(privateRef);
            const currentDare = privateDoc.data()?.currentDare;

            transaction.set(gameRef, {
                status: 'WHISPERING',
                activeTurnUid: nextPlayerUid,
                targetPlayerUid: null,
                namedPlayerUid: null,
                rpsWinnerUid: null,
                rpsScores: {},
                dareInitiatorUid: null, 
                dareTargetName: null
            }, { merge: true });

            transaction.set(privateRef, { currentQuestion: newQuestion, currentDare: currentDare }, { merge: true });
        });

        revalidatePath(`/game/${gameCode}`);
        return { success: true };
    } catch (error) {
        console.error('Error acknowledging dare:', error);
        return { success: false, error: 'Failed to start next round. Please try again.' };
    }
}

export async function nextRoundAfterLetItSlide(gameCode: string, currentUid: string): Promise<{ success: boolean; error?: string }> {
    try {
        const gameRef = firestore.doc(`games/${gameCode}`);
        const privateRef = firestore.doc(`games/${gameCode}/private/data`);
        const nextPlayerUid = await getNextPlayerUid(gameCode, currentUid);
        const newQuestion = await getRandomQuestion();

        await firestore.runTransaction(async (transaction: Transaction) => {
            const privateDoc = await transaction.get(privateRef);
            const lastDare = privateDoc.data()?.currentDare;

            transaction.set(gameRef, {
                status: 'WHISPERING',
                activeTurnUid: nextPlayerUid,
                targetPlayerUid: null,
                namedPlayerUid: null,
                rpsWinnerUid: null,
                rpsScores: {},
                dareInitiatorUid: null, 
                dareTargetName: null
            }, { merge: true });
           
            transaction.set(privateRef, { 
                currentQuestion: newQuestion, 
                currentDare: lastDare || null 
            });
        });

        revalidatePath(`/game/${gameCode}`);
        return { success: true };
    } catch (error) {
        console.error('Error starting next round after let it slide:', error);
        return { success: false, error: 'Failed to start next round. Please try again.' };
    }
}

export async function handleChallengeDecision(gameCode: string, shouldChallenge: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const gameRef = firestore.doc(`games/${gameCode}`);

        if (shouldChallenge) {
            await gameRef.update({ status: 'RPS_CHALLENGE' });
        } else {
            const gameDoc = await gameRef.get();
            const gameData = gameDoc.data();
            if (!gameData || !gameData.activeTurnUid) throw new Error('Game data not found');
            await nextRoundAfterLetItSlide(gameCode, gameData.activeTurnUid);
        }

        revalidatePath(`/game/${gameCode}`);
        return { success: true };

    } catch (error) {
        console.error('Error handling challenge decision:', error);
        return { success: false, error: 'Failed to process decision. Please try again.' };
    }
}

export async function submitRpsChoice(gameCode: string, uid: string, choice: 'rock' | 'paper' | 'scissors'): Promise<{ success: boolean; error?: string }> {
    try {
        const gameRef = firestore.doc(`games/${gameCode}`);

        await firestore.runTransaction(async (transaction: Transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists) throw new Error('Game not found');
            
            const gameData = gameDoc.data()!;
            const { targetPlayerUid, namedPlayerUid } = gameData;
            if (!targetPlayerUid || !namedPlayerUid) throw new Error('Duel participants not found');

            const rpsChoices = gameData.rpsChoices || {};
            rpsChoices[uid] = choice;
            
            let updates: { [key: string]: any } = { rpsChoices };

            if (rpsChoices[targetPlayerUid] && rpsChoices[namedPlayerUid]) {
                const choice1 = rpsChoices[targetPlayerUid];
                const choice2 = rpsChoices[namedPlayerUid];
                
                const rpsScores = gameData.rpsScores || {};
                updates['rpsChoices'] = {}; // Reset choices for the next round.

                if (choice1 !== choice2) { // Not a tie
                    const rules: { [key: string]: string } = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
                    const roundWinnerUid = rules[choice1] === choice2 ? targetPlayerUid : namedPlayerUid;
                    
                    rpsScores[roundWinnerUid] = (rpsScores[roundWinnerUid] || 0) + 1;
                    updates['rpsScores'] = rpsScores;

                    if (rpsScores[roundWinnerUid] >= 2) {
                        updates['status'] = 'LEADER_DECISION';
                        updates['rpsWinnerUid'] = roundWinnerUid;
                    }
                }
            }
            
            transaction.update(gameRef, updates);
        });

        revalidatePath(`/game/${gameCode}`);
        return { success: true };
    } catch (error) {
        console.error('Error submitting RPS choice:', error);
        return { success: false, error: 'Failed to submit choice. Please try again.' };
    }
}

export async function revealQuestion(gameCode: string): Promise<{ success: boolean; error?: string }> {
    try {
        const gameRef = firestore.doc(`games/${gameCode}`);
        await gameRef.update({ status: 'REVEAL_QUESTION' });
        revalidatePath(`/game/${gameCode}`);
        return { success: true };
    } catch (error) {
        console.error('Error revealing question:', error);
        return { success: false, error: 'Failed to reveal question. Please try again.' };
    }
}

export async function nextRound(gameCode: string, currentUid: string): Promise<{ success: boolean; error?: string }> {
    return acknowledgeDare(gameCode, currentUid);
}

export async function nextRoundAfterReveal(gameCode: string, currentUid: string): Promise<{ success: boolean; error?: string }> {
    try {
        const gameRef = firestore.doc(`games/${gameCode}`);
        const privateRef = firestore.doc(`games/${gameCode}/private/data`);
        const nextPlayerUid = await getNextPlayerUid(gameCode, currentUid);
        const newQuestion = await getRandomQuestion();

        await firestore.runTransaction(async (transaction: Transaction) => {
            const privateDoc = await transaction.get(privateRef);
            const lastDare = privateDoc.data()?.currentDare;

            transaction.set(gameRef, {
                status: 'WHISPERING',
                activeTurnUid: nextPlayerUid,
                targetPlayerUid: null,
                namedPlayerUid: null,
                rpsWinnerUid: null,
                rpsScores: {},
                dareInitiatorUid: null, 
                dareTargetName: null
            }, { merge: true });
           
            transaction.set(privateRef, { 
                currentQuestion: newQuestion, 
                currentDare: lastDare || null 
            });
        });

        revalidatePath(`/game/${gameCode}`);
        return { success: true };
    } catch (error) {
        console.error('Error starting next round after reveal:', error);
        return { success: false, error: 'Failed to start next round. Please try again.' };
    }
}

export async function createGame(gameName: string, playerName: string, leaderUid: string): Promise<{ gameCode?: string, success: boolean; error?: string }> {
  try {
    const gameCode = Math.random().toString(36).substring(2, 7).toUpperCase();

    const gameRef = firestore.collection('games').doc(gameCode);
    const firstQuestion = await getRandomQuestion();
    
    await firestore.runTransaction(async (transaction: Transaction) => {
        const privateDocRef = gameRef.collection('private').doc('data');
        transaction.set(gameRef, {
            name: gameName,
            leaderId: leaderUid,
            status: 'LOBBY',
            activeTurnUid: leaderUid, 
            createdAt: FieldValue.serverTimestamp(),
        });
        transaction.set(privateDocRef, { currentQuestion: firstQuestion });
    });

    // Automatically join the creator to the game
    const joinResult = await joinGame(gameCode, leaderUid, playerName);
    if (!joinResult.success) {
      return { success: false, error: joinResult.error };
    }


    return { gameCode, success: true };
  } catch (error) {
    console.error('Error creating game:', error);
    return { success: false, error: 'Could not create game. Please try again.' };
  }
}

export async function joinGame(
  gameCode: string,
  uid: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const gameRef = firestore.doc(`games/${gameCode}`);
    const playersRef = firestore.collection(`games/${gameCode}/players`);

    await firestore.runTransaction(async (transaction: Transaction) => {
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists) {
        throw new Error("Game not found");
      }

      const playersSnapshot = await transaction.get(playersRef);
      if (playersSnapshot.size >= 9) {
        throw new Error("This game is full.");
      }

      const playerRef = playersRef.doc(uid);
      transaction.set(playerRef, {
        uid,
        displayName,
        isOnline: true,
        orderIndex: -1, // Will be set when the game starts
      });
    });

    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error joining game:', error);
    return { success: false, error: error.message };
  }
}

export async function startGame(
  gameCode: string,
  leaderUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const gameRef = firestore.doc(`games/${gameCode}`);
    const playersRef = firestore.collection(`games/${gameCode}/players`);
    
    const playersSnapshot = await playersRef.get();
    const playerCount = playersSnapshot.docs.length;
    if (playerCount < 4) {
      return { success: false, error: "A game requires at least 4 players to start." };
    }
    if (playerCount > 9) {
        return { success: false, error: "A game cannot have more than 9 players." };
    }

    const shuffledPlayers = playersSnapshot.docs.sort(() => Math.random() - 0.5);
    const batch = firestore.batch();
    shuffledPlayers.forEach((doc, index) => {
        batch.update(doc.ref, { orderIndex: index });
    });
    await batch.commit();

    const firstPlayerUid = shuffledPlayers[0].id;

    await gameRef.update({
      status: 'WHISPERING',
      leaderId: leaderUid,
      activeTurnUid: firstPlayerUid
    });

    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error starting game:', error);
    return { success: false, error: 'Failed to start the game. Please try again.' };
  }
}

export async function endGame(gameCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const gameRef = firestore.doc(`games/${gameCode}`);
    
    await deleteCollection(`games/${gameCode}/players`, 50);
    await deleteCollection(`games/${gameCode}/private`, 50);
    await gameRef.delete();

    revalidatePath(`/game/${gameCode}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(`Error ending game ${gameCode}:`, error);
    return { success: false, error: 'Failed to end the game. Please try again.' };
  }
}
