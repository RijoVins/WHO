/**
 * Socket.IO event names.
 * Client → server events are requests the server validates.
 * Server → client events are the only way game state reaches players.
 */
export const ClientEvents = {
  CreateRoom: 'create_room',
  JoinRoom: 'join_room',
  LeaveRoom: 'leave_room',
  SelectMode: 'select_mode',
  StartGame: 'start_game',
  SubmitGuess: 'submit_guess',
  NextRound: 'next_round',
  PlayAgain: 'play_again',
  ReturnToLobby: 'return_to_lobby',
  ResumeSession: 'resume_session',
  UpdateSettings: 'update_settings',
} as const;

export const ServerEvents = {
  RoomUpdated: 'room_updated',
  GameStarted: 'game_started',
  PerformerSelected: 'performer_selected',
  PrivatePrompt: 'private_prompt',
  RoundStarted: 'round_started',
  GuessReceived: 'guess_received',
  RoundEnded: 'round_ended',
  RevealAnswer: 'reveal_answer',
  ScoreUpdated: 'score_updated',
  GameFinished: 'game_finished',
  PlayerDisconnected: 'player_disconnected',
  PlayerReconnected: 'player_reconnected',
} as const;

export type ClientEventName = (typeof ClientEvents)[keyof typeof ClientEvents];
export type ServerEventName = (typeof ServerEvents)[keyof typeof ServerEvents];
