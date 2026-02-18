# **App Name**: Paranoia

## Core Features:

- Game Lobby & Player Management: Allow players to join a game using a unique game code, display active players, and enable the leader to start the game session.
- Whisper & Question Submission: Implement the mechanic for the active player to privately select a target player and submit a 'who' question, securely stored in Firestore.
- Answering & Naming: Enable the target player to view the private question and publicly select another player from the list, updating the game state in real-time.
- Question Reveal Decision: Provide the named player with the option to 'drink' and reveal the private question to all participants, changing the game status accordingly.
- Real-time Game State Synchronization: Ensure all game progression, player actions, and status updates are instantaneously synchronized and displayed across all connected clients using Firestore snapshots.
- Leader Game Control: Empower the game leader to start and end game sessions at any time, initiating necessary database cleanup.
- Automated Data Deletion: Implement a Firebase Cloud Function to automatically delete expired game data and its sub-collections from Firestore, ensuring data hygiene and privacy.

## Style Guidelines:

- Primary color: A vibrant deep purple (#6c26de) to evoke intrigue and a playful mystery against the dark background.
- Background color: A subtle, dark grayish-purple (#1a151d) for a 'Dark Mode' aesthetic, ensuring content stands out without being stark.
- Accent color: A soft, bright lavender-blue (#b3b3e6) to provide contrasting highlights and visual interest for interactive elements.
- Body and headline font: 'Poppins' (sans-serif) for its precise, contemporary, and sleek appearance, fitting the game's modern party aesthetic.
- Use minimalist, line-based icons that hint at conversation, mystery, and game actions, maintaining a sleek and uncluttered look.
- Emphasize clean, intuitive layouts with clear hierarchy on both web (Tailwind CSS) and mobile (Material 3), prioritizing game status visibility and player interaction.
- Incorporate subtle animations for state transitions, player selections, and question reveals to provide smooth feedback and enhance the real-time experience.