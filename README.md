# Marz Games: A Social Deduction Game

This is a web-based social deduction game built with Next.js and Firebase. The game is designed for 4 to 9 players and involves a series of questions, challenges, and dares.

## Gameplay and Features

*   **Lobby System:** Players can create a new game or join an existing one with a unique game code. The lobby has a minimum of 4 players to start and a maximum of 9.
*   **Turn-Based Rounds:** The game progresses in rounds, with one player asking a question to another.
*   **Whispering and Answering:** The active player secretly asks a question to a target player.
*   **The Challenge:** The player who was asked the question must then name another player who they think the question was about.
*   **Rock-Paper-Scissors Duel:** If the named player feels the accusation is unfair, they can challenge the answerer to a best-of-three rock-paper-scissors duel. The winner of the duel gets to decide the final outcome.
*   **Dares:** If a player chooses not to challenge, or if they lose the duel, they must perform a dare given by the active player.
*   **Real-Time Updates:** The game uses Firebase Firestore to provide real-time updates to all players.

## Technology Stack

*   **Framework:** Next.js
*   **Backend:** Firebase (Firestore, Authentication, Functions)
*   **Styling:** Tailwind CSS

## Getting Started

To get started with this project, you will need to have a Firebase project set up. Once you have your Firebase project, you can clone this repository and create a `.env.local` file with your Firebase configuration.
