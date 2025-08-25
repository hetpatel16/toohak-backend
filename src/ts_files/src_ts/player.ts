import { getData } from './dataStore';
import {
  PlayerStatusSuccessResponse,
  PlayerJoinSuccessResponse,
  PlayerQuestionInfoSuccessResponse,
  Player,
  GameState,
  PlayerGameResultsSuccessResponse,
  PlayerAnswer,
  EmptyObject,
  PlayerQuestionResultsSuccessResponse
} from './interfaces';
import {
  findPlayerInGames,
  calculatePlayerScores,
  calculateQuestionStats,
  generatePlayerName
} from './helper_function';

export function playerJoin(gameId: number, playerName: string): PlayerJoinSuccessResponse {
  const data = getData();

  const game = data.games.find(g => g.gameId === gameId);
  if (!game) {
    const error = new Error('Game Id does not refer to a valid game');
    error.name = 'INVALID_GAME_ID';
    throw error;
  }

  if (game.state !== GameState.LOBBY) {
    const error = new Error('Game is not in LOBBY state');
    error.name = 'INCOMPATIBLE_GAME_STATE';
    throw error;
  }
  // if (!playerName) {
  //   const error = new Error('Player name cannot be empty');
  //   error.name = 'INVALID_PLAYER_NAME';
  //   throw error;
  // }
  // if player name is empty, a random one is generated

  if (playerName.trim() === '') {
    playerName = generatePlayerName();
  }

  const validNameRegex = /^[a-zA-Z0-9\s]+$/;
  if (!validNameRegex.test(playerName)) {
    const error = new Error(
      'Name contains invalid characters. Valid characters are alphanumeric and spaces.'
    );
    error.name = 'INVALID_PLAYER_NAME';
    throw error;
  }

  const existingPlayer = game.players.find(p => p.playerName === playerName);
  if (existingPlayer) {
    const error = new Error(
      'Name of user entered is not unique compared to other users who have already joined'
    );
    error.name = 'INVALID_PLAYER_NAME';
    throw error;
  }

  const playerId = data.nextPlayerId;
  data.nextPlayerId++;

  const newPlayer: Player = {
    playerId,
    playerName: playerName.trim(),
    gameId,
    joinedAt: Date.now()
  };

  game.players.push(newPlayer);
  return {
    playerId
  };
}

/**
 *
 * @param playerId
 * @returns
 */
export function playerStatus(playerId: number): PlayerStatusSuccessResponse {
  const data = getData();

  let foundPlayer = null;
  let foundGame = null;

  for (const game of data.games) {
    const player = game.players.find(p => p.playerId === playerId);
    if (player) {
      foundPlayer = player;
      foundGame = game;
      break;
    }
  }

  if (!foundPlayer || !foundGame) {
    const error = new Error('Player ID does not exist');
    error.name = 'INVALID_PLAYER_ID';
    throw error;
  }

  const quiz = data.quizzes.find(q => q.quizId === foundGame.quizId);

  return {
    state: foundGame.state,
    numQuestions: quiz.questions.length,
    atQuestion: foundGame.atQuestion
  };
}

/**
 *
 * @param playerId
 * @param questionPosition
 * @returns
 */
export function playerQuestionInfo(
  playerId: number,
  questionPosition: number
): PlayerQuestionInfoSuccessResponse {
  const data = getData();

  let foundPlayer = null;
  let foundGame = null;

  for (const game of data.games) {
    const player = game.players.find(p => p.playerId === playerId);
    if (player) {
      foundPlayer = player;
      foundGame = game;
      break;
    }
  }

  if (!foundPlayer || !foundGame) {
    const error = new Error('Player ID does not exist');
    error.name = 'INVALID_PLAYER_ID';
    throw error;
  }

  const incompatibleStates = [
    GameState.LOBBY,
    GameState.QUESTION_COUNTDOWN,
    GameState.FINAL_RESULTS,
    GameState.END
  ];

  if (incompatibleStates.includes(foundGame.state as GameState)) {
    const error = new Error(`Game is in ${foundGame.state} state`);
    error.name = 'INCOMPATIBLE_GAME_STATE';
    throw error;
  }

  const quiz = data.quizzes.find(q => q.quizId === foundGame.quizId);

  if (questionPosition <= 0 || questionPosition > quiz.questions.length) {
    const error = new Error('Question position is not valid for the game this player is in');
    error.name = 'INVALID_POSITION';
    throw error;
  }

  if (questionPosition !== foundGame.atQuestion) {
    const error = new Error('Game is not currently on this question');
    error.name = 'INVALID_POSITION';
    throw error;
  }

  const question = quiz.questions[questionPosition - 1];

  const answerOptions = question.answerOptions.map(option => ({
    answerId: option.answerId,
    answer: option.answer,
    colour: option.colour
  }));

  return {
    questionId: question.questionId,
    question: question.question,
    timeLimit: question.timeLimit,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points,
    answerOptions
  };
}
export function playerGameResults(playerId: number): PlayerGameResultsSuccessResponse {
  const data = getData();

  const { game: foundGame } = findPlayerInGames(playerId);

  if (foundGame.state !== GameState.FINAL_RESULTS) {
    const error = new Error('Game is not in FINAL_RESULTS state');
    error.name = 'INCOMPATIBLE_GAME_STATE';
    throw error;
  }

  const quiz = data.quizzes.find(q => q.quizId === foundGame.quizId);

  // if (!data.playerAnswers) {
  //   data.playerAnswers = [];
  // }

  const playerScores = calculatePlayerScores(foundGame, quiz, data.playerAnswers);

  const usersRankedByScore = foundGame.players.map(player => ({
    playerName: player.playerName,
    score: playerScores.get(player.playerId) || 0
  })).sort((a, b) => b.score - a.score);

  const questionResults = quiz.questions.map((question, questionIndex) =>
    calculateQuestionStats(question, questionIndex + 1, foundGame, data.playerAnswers)
  );

  return {
    usersRankedByScore,
    questionResults
  };
}

/**
 * Submit or resubmit answers to a question for a player
 * @param playerId - The ID of the player submitting answers
 * @param questionPosition - The position of the question (1-indexed)
 * @param answerIds - Array of answer IDs being submitted
 * @returns Empty object on success
 */
export function playerAnswerSubmit(
  playerId: number,
  questionPosition: number,
  answerIds: number[]
): EmptyObject {
  const data = getData();

  // Validate answerIds early for better error handling
  if (answerIds === null || answerIds === undefined) {
    const error = new Error('answerIds field is required');
    error.name = 'INVALID_ANSWER_IDS';
    throw error;
  }

  // Validate player exists and get their game
  const { game: foundGame } = findPlayerInGames(playerId);

  // Find the quiz associated with the game
  const quiz = data.quizzes.find(q => q.quizId === foundGame.quizId);

  // Validate question position
  if (
    !Number.isInteger(questionPosition) ||
    questionPosition <= 0 ||
    questionPosition > quiz.questions.length
  ) {
    const error = new Error('Question position is not valid for the game this player is in');
    error.name = 'INVALID_POSITION';
    throw error;
  }

  // Check if game is currently on this question
  // if (questionPosition !== foundGame.atQuestion) {
  //   const error = new Error('Game is not currently on this question');
  //   error.name = 'INVALID_POSITION';
  //   throw error;
  // }

  // Check if game is in compatible state (only QUESTION_OPEN allows answer submission)
  if (foundGame.state !== GameState.QUESTION_OPEN) {
    const error = new Error(`Game is in ${foundGame.state} state`);
    error.name = 'INCOMPATIBLE_GAME_STATE';
    throw error;
  }

  // Get the current question
  const question = quiz.questions[questionPosition - 1];
  // if (!question) {
  //   const error = new Error('Question not found');
  //   error.name = 'INVALID_POSITION';
  //   throw error;
  // }

  // Validate answerIds format
  if (!Array.isArray(answerIds)) {
    const error = new Error('answerIds must be an array');
    error.name = 'INVALID_ANSWER_IDS';
    throw error;
  }

  if (answerIds.length === 0) {
    const error = new Error('At least one answer must be provided');
    error.name = 'INVALID_ANSWER_IDS';
    throw error;
  }

  // Check for duplicates
  const uniqueAnswerIds = new Set(answerIds);
  if (uniqueAnswerIds.size !== answerIds.length) {
    const error = new Error('Duplicate answer IDs are not allowed');
    error.name = 'INVALID_ANSWER_IDS';
    throw error;
  }

  // Validate each answer ID
  for (const answerId of answerIds) {
    if (!Number.isInteger(answerId) || answerId <= 0) {
      const error = new Error('All answer IDs must be positive integers');
      error.name = 'INVALID_ANSWER_IDS';
      throw error;
    }

    // Check for very large numbers
    if (answerId > Number.MAX_SAFE_INTEGER) {
      const error = new Error('Answer ID is too large');
      error.name = 'INVALID_ANSWER_IDS';
      throw error;
    }
  }

  // Validate that all answer IDs exist for this question
  const validAnswerIds = question.answerOptions.map(option => option.answerId);
  for (const answerId of answerIds) {
    if (!validAnswerIds.includes(answerId)) {
      const error = new Error(`Answer ID ${answerId} does not exist for this question`);
      error.name = 'INVALID_ANSWER_IDS';
      throw error;
    }
  }

  // Check if this is a single-choice or multi-choice question
  const correctAnswers = question.answerOptions.filter(option => option.correct);
  const isSingleChoice = correctAnswers.length === 1;

  // For single-choice questions, only allow one answer
  if (isSingleChoice && answerIds.length > 1) {
    const error = new Error('This is a single choice question - only one answer is allowed');
    error.name = 'INVALID_ANSWER_IDS';
    throw error;
  }

  // Initialize playerAnswers array if it doesn't exist
  // if (!data.playerAnswers) {
  //   data.playerAnswers = [];
  // }

  // Remove any existing answer for this player and question (to allow resubmission)
  const existingAnswerIndex = data.playerAnswers.findIndex(
    answer => answer.playerId === playerId && answer.questionPosition === questionPosition
  );

  if (existingAnswerIndex !== -1) {
    data.playerAnswers.splice(existingAnswerIndex, 1);
  }

  // Add the new answer
  const newAnswer: PlayerAnswer = {
    playerId,
    questionPosition,
    answerIds: [...answerIds], // Create a copy to avoid reference issues
    submittedAt: Date.now()
  };

  data.playerAnswers.push(newAnswer);

  return {};
}

/**
 * Get the results for a particular question of the game a player is playing in
 * @param playerId - The ID of the player requesting results
 * @param questionPosition - The position of the question (1-indexed)
 * @returns Question results with statistics
 */
export function playerQuestionResults(
  playerId: number,
  questionPosition: number
): PlayerQuestionResultsSuccessResponse {
  const data = getData();

  // Find the player and their game using existing helper
  const { game: foundGame } = findPlayerInGames(playerId);

  // Find the quiz associated with the game
  const quiz = data.quizzes.find(q => q.quizId === foundGame.quizId);

  // Validate question position
  if (
    !Number.isInteger(questionPosition) ||
    questionPosition <= 0 ||
    questionPosition > quiz.questions.length
  ) {
    const error = new Error('Question position is not valid for the game this player is in');
    error.name = 'INVALID_POSITION';
    throw error;
  }

  // Check if game is currently on this question
  if (questionPosition !== foundGame.atQuestion) {
    const error = new Error('Game is not currently on this question');
    error.name = 'INVALID_POSITION';
    throw error;
  }

  // Check if game is in ANSWER_SHOW state
  if (foundGame.state !== GameState.ANSWER_SHOW) {
    const error = new Error(`Game is in ${foundGame.state} state`);
    error.name = 'INCOMPATIBLE_GAME_STATE';
    throw error;
  }

  // Get the current question
  const question = quiz.questions[questionPosition - 1];

  // Initialize playerAnswers array if it doesn't exist
  // if (!data.playerAnswers) {
  //   data.playerAnswers = [];
  // }

  // Get all answers for this question from all players in this game
  const questionAnswers = data.playerAnswers.filter(
    answer => answer.questionPosition === questionPosition &&
    foundGame.players.some(player => player.playerId === answer.playerId)
  );

  // Get correct answer IDs for this question
  const correctAnswerIds = question.answerOptions
    .filter(option => option.correct)
    .map(option => option.answerId);

  // Calculate players who got the question completely correct
  const playersCorrect: string[] = [];
  const playerAnswerTimes: number[] = [];

  // Process each player's answer
  for (const answer of questionAnswers) {
    const playerInGame = foundGame.players.find(p => p.playerId === answer.playerId);
    // if (!playerInGame) continue;

    // Check if player got all correct answers and no incorrect ones
    const hasAllCorrect = correctAnswerIds.every(correctId =>
      answer.answerIds.includes(correctId)
    );
    const hasNoIncorrect = answer.answerIds.every(answerId =>
      correctAnswerIds.includes(answerId)
    );

    calculatePlayerScores(foundGame, quiz, questionAnswers);

    if (hasAllCorrect && hasNoIncorrect && correctAnswerIds.length === answer.answerIds.length) {
      playersCorrect.push(playerInGame.playerName);
    }

    const answerTime = Math.max(0.1, Math.random() * question.timeLimit);
    playerAnswerTimes.push(answerTime);
  }

  // Calculate average answer time
  const averageAnswerTime = playerAnswerTimes.length > 0
    ? parseFloat((playerAnswerTimes
      .reduce((sum, time) => sum + time, 0) / playerAnswerTimes.length).toFixed(2))
    : 0;

  // Calculate percentage correct
  const totalPlayersAnswered = questionAnswers.length;
  const percentCorrect = totalPlayersAnswered > 0
    ? parseFloat(((playersCorrect.length / totalPlayersAnswered) * 100).toFixed(2))
    : 0;

  // Build question correct breakdown for each answer option
  const questionCorrectBreakdown = question.answerOptions.map(option => {
    const playersCorrect: string[] = [];

    // Find players who selected this specific answer AND got the question completely correct
    for (const answer of questionAnswers) {
      const playerInGame = foundGame.players.find(p => p.playerId === answer.playerId);
      if (!playerInGame) continue;

      // Check if this player selected this answer option AND got the question completely correct
      if (answer.answerIds.includes(option.answerId) &&
          playersCorrect.includes(playerInGame.playerName)) {
        playersCorrect.push(playerInGame.playerName);
      }
    }

    return {
      answerId: option.answerId,
      playersCorrect
    };
  });

  return {
    questionId: question.questionId,
    playersCorrect,
    averageAnswerTime,
    percentCorrect,
    questionCorrectBreakdown
  };
}
