export const DB_NAME = "chesseDB"

export const GAME_STATUS = {
  WAITING: "waiting",
  ACTIVE: "active",
  FINISHED: "finished"
};

export const GAME_RESULT = {
  WHITE: "white",
  BLACK: "black",
  DRAW: "draw"
};

export const GAME_END_REASON = {
  CHECKMATE: "checkmate",
  RESIGN: "resign",
  TIMEOUT: "timeout",
  DRAW: "draw"
};

export const PLAYER_COLOR = {
  WHITE: "white",
  BLACK: "black"
};

export const USER_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  IN_GAME: "in-game"
};

export const TIME_CONTROL = {
  BULLET: "bullet",
  BLITZ: "blitz",
  RAPID: "rapid",
  CLASSICAL: "classical"
};

export const SOCKET_EVENTS = {
  JOIN_GAME: "join_game",
  LEAVE_GAME: "leave_game",
  MAKE_MOVE: "make_move",
  MOVE_MADE: "move_made",
  GAME_START: "game_start",
  GAME_END: "game_end",
  RESIGN: "resign",
  DRAW_REQUEST: "draw_request",
  DRAW_ACCEPT: "draw_accept",
  ERROR: "error"
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  INVALID_MOVE: "Invalid chess move",
  GAME_NOT_FOUND: "Game not found",
  GAME_ALREADY_FINISHED: "Game already finished",
  NOT_YOUR_TURN: "Not your turn",
  PLAYER_NOT_IN_GAME: "Player not part of this game"
};
