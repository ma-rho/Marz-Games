// Note: This file is for a Flutter application and mirrors the TypeScript types.
// It uses the cloud_firestore package.

import 'package:cloud_firestore/cloud_firestore.dart';

enum GameStatus {
  LOBBY,
  WHISPERING,
  ANSWERING,
  DECIDING,
  REVEALED,
  ENDED,
}

class Game {
  final String gameCode;
  final GameStatus status;
  final String leaderId;
  final String? activeTurnUid;
  final String? targetPlayerUid;
  final String? namedPlayerUid;
  final Timestamp lastUpdated;
  final String? question;

  Game({
    required this.gameCode,
    required this.status,
    required this.leaderId,
    this.activeTurnUid,
    this.targetPlayerUid,
    this.namedPlayerUid,
    required this.lastUpdated,
    this.question,
  });

  factory Game.fromFirestore(DocumentSnapshot<Map<String, dynamic>> snapshot) {
    final data = snapshot.data();
    if (data == null) throw Exception("Game data is null");

    return Game(
      gameCode: data['gameCode'] ?? '',
      status: GameStatus.values.firstWhere(
        (e) => e.toString().split('.').last == data['status'],
        orElse: () => GameStatus.LOBBY,
      ),
      leaderId: data['leaderId'] ?? '',
      activeTurnUid: data['activeTurnUid'],
      targetPlayerUid: data['targetPlayerUid'],
      namedPlayerUid: data['namedPlayerUid'],
      lastUpdated: data['lastUpdated'] ?? Timestamp.now(),
      question: data['question'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'gameCode': gameCode,
      'status': status.name,
      'leaderId': leaderId,
      if (activeTurnUid != null) 'activeTurnUid': activeTurnUid,
      if (targetPlayerUid != null) 'targetPlayerUid': targetPlayerUid,
      if (namedPlayerUid != null) 'namedPlayerUid': namedPlayerUid,
      'lastUpdated': lastUpdated,
      if (question != null) 'question': question,
    };
  }
}

class Player {
  final String uid;
  final String displayName;
  final bool isOnline;
  final int orderIndex;

  Player({
    required this.uid,
    required this.displayName,
    required this.isOnline,
    required this.orderIndex,
  });

  factory Player.fromFirestore(DocumentSnapshot<Map<String, dynamic>> snapshot) {
    final data = snapshot.data();
    if (data == null) throw Exception("Player data is null");

    return Player(
      uid: data['uid'] ?? '',
      displayName: data['displayName'] ?? '',
      isOnline: data['isOnline'] ?? false,
      orderIndex: data['orderIndex'] ?? 0,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'uid': uid,
      'displayName': displayName,
      'isOnline': isOnline,
      'orderIndex': orderIndex,
    };
  }
}

class PrivateData {
  final String currentQuestion;

  PrivateData({required this.currentQuestion});

  factory PrivateData.fromFirestore(DocumentSnapshot<Map<String, dynamic>> snapshot) {
    final data = snapshot.data();
     if (data == null) throw Exception("Private data is null");

    return PrivateData(
      currentQuestion: data['currentQuestion'] ?? '',
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'currentQuestion': currentQuestion,
    };
  }
}
