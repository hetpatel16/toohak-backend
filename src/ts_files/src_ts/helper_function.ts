import { getData } from './dataStore';
import { v4 as uuidv4 } from 'uuid';
import {
  EmptyObject,
  Game,
  Quiz,
  Sessions,
  colourData,
  Player,
  Question,
  PlayerAnswer,
  NameType
} from './interfaces';
import crypto from 'crypto';
import { Downtimer } from 'downtimer';
import validator from 'validator';

export const COUNT_DOWN = 3;

/**
 * Creates a new session for a user.
 * @param userId
 * @returns
 */
export function createSession(userId: number): string {
  const data = getData();
  const session = uuidv4();

  const newSession: Sessions = {
    session,
    userId,
    createdAt: Date.now()
  };

  data.sessions.push(newSession);
  return session;
}

/**
 * Validates a session and returns the associated userId which the session was created for.
 * @param sessionId
 * @returns
 */
export function validateSession(sessionId: string): number | null {
  if (!sessionId) {
    return null;
  }

  const data = getData();
  const session = data.sessions.find(s => s.session === sessionId);

  if (!session) {
    return null;
  }

  return session.userId;
}

/**
 * Removes a specific session.
 * @param sessionId
 * @returns
 */
export function removeSession(sessionId: string): boolean {
  const data = getData();
  const sessionIndex = data.sessions.findIndex(s => s.session === sessionId);

  data.sessions.splice(sessionIndex, 1);

  return true;
}

/**
 * Help function to create error message for adminAuthLogin
 * @param {string} message
 * @returns {{error: string, message: string}}
 */
export function createErrorResponse (errorName: string,
  message: string): Error {
  const error = new Error(message);
  error.name = errorName;

  return error;
}

/**
 *
 * @param password
 * @returns
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Help function to validate new password for adminUserPasswordUpdate
 * @param oldPassword
 * @param newPassword
 * @returns
 */
export function validateNewPassword(oldPassword: string,
  newPassword: string): void {
  // checks if new passwords is different from old password
  if (oldPassword === newPassword) {
    const error = new Error('New password cannot be the same as old password');
    error.name = 'INVALID_NEW_PASSWORD';
    throw error;
  }

  // checks if new password is atleast 8 in length
  if (newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters');
    error.name = 'INVALID_NEW_PASSWORD';
    throw error;
  }

  // test if new password contains atleast one letter and one number.
  const letterContained = /[a-zA-z]/.test(newPassword);
  const numberContained = /[0-9]/.test(newPassword);
  // checks if new password contains atleast one letter and one number
  if (!letterContained || !numberContained) {
    const error = new Error(
      'New password must contain at least one letter ' +
      'and one number'
    );
    error.name = 'INVALID_NEW_PASSWORD';
    throw error;
  }
}

// Helper function for name validation
export function validateName(name: string, nameType: NameType): void {
  if (!validator.isLength(name, { min: 2, max: 20 })) {
    throw createErrorResponse(`INVALID_${nameType}_NAME`,
      `Name${nameType} is less than 2 characters or more than 20 characters`);
  }

  if (!validator.isAlpha(name, 'en-US', { ignore: ' -\'' })) {
    throw createErrorResponse(`INVALID_${nameType}_NAME`,
      `Name${nameType} contains characters other than
      lowercase letters, uppercase letters, spaces, hyphens, or apostrophes`);
  }
}

/**
 *  Checks if the provided quizId exists in the quizzes list.
 *
 * @param {Quiz[]} quizzes
 * @param {number} quizId
 *
 * @returns {boolean} - returns true if quizId is invalid, false otherwise.
 */
export function invalidQuiz(quizzes: Quiz[], quizId: number): boolean {
  if (quizzes.find((quiz) => quiz.quizId === quizId) === undefined) {
    return true;
  }
  return false;
}

/**
 *
 * @returns colour: string
 */
export function generateColour() : string {
  const colours = colourData.colours;
  const index = Math.floor(Math.random() * colours.length);
  const randElement = colours[index];
  return randElement;
}

// adminQuizGameUpdate helper functions

/**
 *  Update questionPosition
 * @param {Game} game
 */
export function NextQuestion(game: Game) {
  game.atQuestion++;
}

/**
 *  Checks if gevin question is the last quesiton
 * @param {Game} game
 * @param {number} totalQuestions
 * @returns {boolean}
 */
export function isLastQuestion(game: Game, totalQuestions: number): boolean {
  return game.atQuestion > totalQuestions;
}

/**
 * Update nextQuestion's state
 * @param {Game} game
 * @param {Downtimer} timers
 * @param {number} totalQuestions
 * @param {number} duration
 * @returns
 */
export function updateNextQuestion(
  game: Game,
  timers: Downtimer,
  totalQuestions: number,
  duration: number): EmptyObject {
  game.state = 'QUESTION_COUNTDOWN';
  NextQuestion(game);
  game.startCountDown = timers.schedule(() => {
    if (isLastQuestion(game, totalQuestions)) {
      game.state = 'FINAL_RESULTS';
    } else {
      game.state = 'QUESTION_OPEN';
      timers.clear(game.startCountDown);
      timers.clear(game.startQuestionTimer);
      game.startQuestionTimer = timers.schedule(() => {
        game.state = 'QUESTION_CLOSE';
      }, duration * 1000);
    }
  }, COUNT_DOWN * 1000);
  return {};
}

export function findPlayerInGames(playerId: number): { player: Player; game: Game } {
  const data = getData();

  for (const game of data.games) {
    const player = game.players.find(p => p.playerId === playerId);
    if (player) {
      return { player, game };
    }
  }

  const error = new Error('Player ID does not exist');
  error.name = 'INVALID_PLAYER_ID';
  throw error;
}

// helper functions for playerGameResults (final results)

/**
 * Helper function to check if a player's answer is completely correct
 * @param answerIds
 * @param correctAnswerIds
 * @returns
 */
function isAnswerCorrect(answerIds: number[], correctAnswerIds: number[]): boolean {
  const hasAllCorrect = correctAnswerIds.every(correctId => answerIds.includes(correctId));
  const hasNoIncorrect = answerIds.every(answerId => correctAnswerIds.includes(answerId));
  return hasAllCorrect && hasNoIncorrect && correctAnswerIds.length === answerIds.length;
}

/**
 * Helper function to calculate player scores
 * @param game
 * @param quiz
 * @param playerAnswers
 * @returns
 */
export function calculatePlayerScores(
  game: Game,
  quiz: Quiz,
  playerAnswers: PlayerAnswer[]
): Map<number, number> {
  const playerScores = new Map<number, number>();

  game.players.forEach(player => {
    playerScores.set(player.playerId, 0);
  });

  quiz.questions.forEach((question, questionIndex) => {
    const questionPosition = questionIndex + 1;
    const correctAnswerIds = question.answerOptions
      .filter(option => option.correct)
      .map(option => option.answerId);

    const questionAnswers = playerAnswers.filter(
      answer => answer.questionPosition === questionPosition &&
      game.players.some(player => player.playerId === answer.playerId)
    );

    questionAnswers.forEach(answer => {
      if (isAnswerCorrect(answer.answerIds, correctAnswerIds)) {
        const currentScore = playerScores.get(answer.playerId) || 0;
        playerScores.set(answer.playerId, currentScore + question.points);
      }
    });
  });

  return playerScores;
}

/**
 * Helper function to calculate statistics for a single question
 * @param question
 * @param questionPosition
 * @param game
 * @param playerAnswers
 * @returns
 */
export function calculateQuestionStats(
  question: Question,
  questionPosition: number,
  game: Game,
  playerAnswers: PlayerAnswer[]
) {
  const correctAnswerIds = question.answerOptions
    .filter(option => option.correct)
    .map(option => option.answerId);

  const questionAnswers = playerAnswers.filter(
    answer => answer.questionPosition === questionPosition &&
    game.players.some(player => player.playerId === answer.playerId)
  );

  const playersCorrect: string[] = [];
  const answerTimes: number[] = [];

  questionAnswers.forEach(answer => {
    const playerInGame = game.players.find(p => p.playerId === answer.playerId);
    if (!playerInGame) return;

    if (isAnswerCorrect(answer.answerIds, correctAnswerIds)) {
      playersCorrect.push(playerInGame.playerName);
    }

    const answerTime = Math.min(question.timeLimit, Math.max(0.5,
      0.5 + (Math.random() * (question.timeLimit - 0.5))
    ));
    answerTimes.push(answerTime);
  });

  const averageAnswerTime = answerTimes.length > 0
    ? parseFloat((answerTimes.reduce((sum, time) => sum + time, 0) / answerTimes.length).toFixed(2))
    : 0;

  const percentCorrect = questionAnswers.length > 0
    ? parseFloat(((playersCorrect.length / questionAnswers.length) * 100).toFixed(2))
    : 0;

  return {
    questionId: question.questionId,
    playersCorrect,
    averageAnswerTime,
    percentCorrect
  };
}
/**
 *
 * @returns generated name of digits and letters
 */
export function generatePlayerName () {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';

  let letterPart = '';
  while (letterPart.length < 5) {
    const randLetter = letters[Math.floor(Math.random() * letters.length)];
    if (!letterPart.includes(randLetter)) {
      letterPart += randLetter;
    }
  }

  let digitPart = '';
  while (digitPart.length < 3) {
    const randDigit = digits[Math.floor(Math.random() * digits.length)];
    if (!digitPart.includes(randDigit)) {
      digitPart += randDigit;
    }
  }

  return letterPart + digitPart;
}
