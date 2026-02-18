/**
 * NOTE: This file contains source code for Firebase Cloud Functions.
 * It should be deployed as part of a Firebase project.
 * You would typically have a `functions` directory in your project root.
 * For more info, see: https://firebase.google.com/docs/functions/get-started
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Helper to recursively delete subcollections.
async function deleteCollection(collectionPath: string, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(
  query: admin.firestore.Query,
  resolve: (value: unknown) => void
) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve(true);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

/**
 * Callable function for the game leader to end a game session.
 * This function performs a recursive delete of the game and its subcollections.
 */
export const endGame = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  const gameId = data.gameId;

  if (!uid || !gameId) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const gameRef = db.collection("games").doc(gameId);
  const gameDoc = await gameRef.get();

  if (!gameDoc.exists || gameDoc.data()?.leaderId !== uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You must be the leader to end the game."
    );
  }

  // Delete subcollections first
  await deleteCollection(`games/${gameId}/players`, 50);
  await deleteCollection(`games/${gameId}/private`, 50);

  // Delete the game document itself
  await gameRef.delete();

  return { success: true };
});

/**
 * Scheduled function that runs every 6 hours to clean up old, inactive games.
 * An active game is defined by its `lastUpdated` timestamp.
 */
export const scheduledCleanup = functions.pubsub
  .schedule("every 6 hours")
  .onRun(async () => {
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    const oldGamesQuery = db
      .collection("games")
      .where("lastUpdated", "<", admin.firestore.Timestamp.fromDate(sixHoursAgo));

    const oldGames = await oldGamesQuery.get();
    
    if (oldGames.empty) {
        functions.logger.log("No old games to delete.");
        return null;
    }

    const deletePromises: Promise<any>[] = [];

    oldGames.forEach((doc) => {
        const gameId = doc.id;
        functions.logger.log(`Queueing old game for deletion: ${gameId}`);
        // Delete subcollections
        deletePromises.push(deleteCollection(`games/${gameId}/players`, 50));
        deletePromises.push(deleteCollection(`games/${gameId}/private`, 50));
        // Delete game doc
        deletePromises.push(doc.ref.delete());
    });

    await Promise.all(deletePromises);
    functions.logger.log(`Cleanup finished. Deleted ${oldGames.size} games.`);
    return null;
  });
