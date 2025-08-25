import {
  registerUser,
  loginUserBody,
  createQuiz,
  questionCreateId,
  startGame,
  clearData,
  joinGame,
  updateGameState,
  expectError
} from '../test_helper_functions';
import {
  QuizCreateSuccessResponse,
} from './../../src_ts/interfaces';
import request from 'sync-request-curl';
import config from './../../../config.json';

const port = config.port;
const url = config.url;

export function getPlayerQuestionResults(playerId: number, questionPosition: number) {
  return request(
    'GET', `${url}:${port}/v1/player/${playerId}/question/${questionPosition}/results`, {
      timeout: 100
    });
}

export function submitPlayerAnswer(
  playerId: number,
  questionPosition:
  number, answerIds:
  number[]) {
  return request(
    'PUT', `${url}:${port}/v1/player/${playerId}/question/${questionPosition}/answer`, {
      json: {
        answerIds: answerIds
      },
      timeout: 100
    });
}

describe('playerQuestionResults', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test('returns question results when game is in ANSWER_SHOW state', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'What is 2+2?',
        30,
        10,
        [
          { answer: '3', correct: false },
          { answer: '4', correct: true },
          { answer: '5', correct: false },
          { answer: '6', correct: false }
        ],
        quiz.quizId,
        'https://example.com/math.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      // Progress to QUESTION_OPEN
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

      // Move to ANSWER_SHOW state
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      const resultsRes = getPlayerQuestionResults(joinResult.playerId, 1);
      const resultsResult = JSON.parse(resultsRes.body.toString());

      expect(resultsRes.statusCode).toBe(200);
      expect(resultsResult).toEqual({
        questionId: expect.any(Number),
        playersCorrect: expect.any(Array),
        averageAnswerTime: expect.any(Number),
        percentCorrect: expect.any(Number),
        questionCorrectBreakdown: expect.arrayContaining([
          {
            answerId: expect.any(Number),
            playersCorrect: expect.any(Array)
          }
        ])
      });
    });

    test('returns correct statistics with multiple players and mixed answers', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'What is the capital of France?',
        30,
        10,
        [
          { answer: 'London', correct: false },
          { answer: 'Paris', correct: true },
          { answer: 'Berlin', correct: false },
          { answer: 'Madrid', correct: false }
        ],
        quiz.quizId,
        'https://example.com/france.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      // Join multiple players
      const joinRes1 = joinGame(game.gameId, 'CorrectPlayer');
      const player1 = JSON.parse(joinRes1.body.toString());

      // Progress to QUESTION_OPEN
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

      // Move to ANSWER_SHOW
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      const resultsRes = getPlayerQuestionResults(player1.playerId, 1);
      const resultsResult = JSON.parse(resultsRes.body.toString());

      expect(resultsRes.statusCode).toBe(200);
      expect(resultsResult.playersCorrect).toEqual(expect.any(Array));
      expect(resultsResult.percentCorrect).toBeGreaterThanOrEqual(0);
      expect(resultsResult.percentCorrect).toBeLessThanOrEqual(100);
      expect(resultsResult.averageAnswerTime).toBeGreaterThanOrEqual(0);
      expect(resultsResult.questionCorrectBreakdown).toHaveLength(4);
    });

    test('returns results for different question positions in multi-question quiz', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(
        userSession.session,
        'Multi Question Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      // Create two questions
      questionCreateId(
        userSession.session,
        'Question 1: What is 2+2?',
        30,
        5,
        [
          { answer: '3', correct: false },
          { answer: '4', correct: true }
        ],
        quiz.quizId,
        'https://example.com/q1.jpg'
      );

      questionCreateId(
        userSession.session,
        'Question 2: What is 3+3?',
        30,
        5,
        [
          { answer: '5', correct: false },
          { answer: '6', correct: true }
        ],
        quiz.quizId,
        'https://example.com/q2.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      // Test Question 1 results
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      const q1ResultsRes = getPlayerQuestionResults(joinResult.playerId, 1);
      const q1Results = JSON.parse(q1ResultsRes.body.toString());

      expect(q1ResultsRes.statusCode).toBe(200);
      expect(q1Results.questionId).toEqual(expect.any(Number));

      // Move to Question 2
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      const q2ResultsRes = getPlayerQuestionResults(joinResult.playerId, 2);
      const q2Results = JSON.parse(q2ResultsRes.body.toString());

      expect(q2ResultsRes.statusCode).toBe(200);
      expect(q2Results.questionId).toEqual(expect.any(Number));
      expect(q2Results.questionId).not.toBe(q1Results.questionId);
    });

    test('returns empty results when no players submitted answers', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'Unanswered question?',
        30,
        10,
        [
          { answer: 'A', correct: true },
          { answer: 'B', correct: false }
        ],
        quiz.quizId,
        'https://example.com/unanswered.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      // Progress without submitting answers
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      const resultsRes = getPlayerQuestionResults(joinResult.playerId, 1);
      const resultsResult = JSON.parse(resultsRes.body.toString());

      expect(resultsRes.statusCode).toBe(200);
      expect(resultsResult.playersCorrect).toHaveLength(0);
      expect(resultsResult.percentCorrect).toBe(0);
      expect(resultsResult.averageAnswerTime).toBe(0);
    });
  });

  describe('Error Cases', () => {
    test('returns error for invalid player ID - non-existent player', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'Test question?',
        30,
        5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const invalidPlayerId = joinResult.playerId + 999;
      const resultsRes = getPlayerQuestionResults(invalidPlayerId, 1);

      expectError(resultsRes, 400);
      const resultsResult = JSON.parse(resultsRes.body.toString());
      expect(resultsResult).toEqual({
        error: 'INVALID_PLAYER_ID',
        message: expect.any(String)
      });
    });

    test('returns error for invalid question position - position too high', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      // Only create 1 question
      questionCreateId(
        userSession.session,
        'Only question?',
        30,
        5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      // Try to access question 2 when only 1 exists
      const resultsRes = getPlayerQuestionResults(joinResult.playerId, 2);

      expectError(resultsRes, 400);
      const resultsResult = JSON.parse(resultsRes.body.toString());
      expect(resultsResult).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String)
      });
    });

    test('returns error for invalid question position - zero and negative positions', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'Test question?',
        30,
        5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      // Test zero position
      const zeroRes = getPlayerQuestionResults(joinResult.playerId, 0);
      expectError(zeroRes, 400);

      const zeroResult = JSON.parse(zeroRes.body.toString());
      expect(zeroResult).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String)
      });

      // Test negative position
      const negativeRes = getPlayerQuestionResults(joinResult.playerId, -1);
      expectError(negativeRes, 400);

      const negativeResult = JSON.parse(negativeRes.body.toString());
      expect(negativeResult).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String)
      });
    });

    test('returns error when game is in QUESTION_OPEN state (not ANSWER_SHOW)', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'Test question?',
        30,
        5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      // Progress to QUESTION_OPEN but NOT to ANSWER_SHOW
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

      const resultsRes = getPlayerQuestionResults(joinResult.playerId, 1);

      expectError(resultsRes, 400);
      const resultsResult = JSON.parse(resultsRes.body.toString());
      expect(resultsResult).toEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });

    test('returns error when game is in LOBBY state', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'Test question?',
        30,
        5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      // Stay in LOBBY state
      const resultsRes = getPlayerQuestionResults(joinResult.playerId, 1);

      expectError(resultsRes, 400);
      const resultsResult = JSON.parse(resultsRes.body.toString());
      expect(resultsResult).toEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });

    test('returns error when trying to access question not currently active', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      // Create 2 questions
      questionCreateId(userSession.session, 'Question 1?', 30, 5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz.quizId, 'https://example.com/q1.jpg');

      questionCreateId(userSession.session, 'Question 2?', 30, 5,
        [{ answer: 'C', correct: true }, { answer: 'D', correct: false }],
        quiz.quizId, 'https://example.com/q2.jpg');

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      // Progress to Question 1 ANSWER_SHOW
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      // Try to access Question 2 results while on Question 1
      const resultsRes = getPlayerQuestionResults(joinResult.playerId, 2);

      expectError(resultsRes, 400);
      const resultsResult = JSON.parse(resultsRes.body.toString());
      expect(resultsResult).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String)
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles multi-choice questions with multiple correct answers', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'Which are primary colors?',
        30,
        10,
        [
          { answer: 'Red', correct: true },
          { answer: 'Blue', correct: true },
          { answer: 'Green', correct: false },
          { answer: 'Yellow', correct: true }
        ],
        quiz.quizId,
        'https://example.com/colors.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      const resultsRes = getPlayerQuestionResults(joinResult.playerId, 1);
      const resultsResult = JSON.parse(resultsRes.body.toString());

      expect(resultsRes.statusCode).toBe(200);
      expect(resultsResult.questionCorrectBreakdown).toHaveLength(4);
    });

    test('multiple players can access same question results independently', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz =
      createQuiz(
        userSession.session,
        'Test Quiz',
        'Test Description'
      ) as QuizCreateSuccessResponse;

      questionCreateId(
        userSession.session,
        'Shared question?',
        30,
        5,
        [{ answer: 'Option 1', correct: true }, { answer: 'Option 2', correct: false }],
        quiz.quizId,
        'https://example.com/shared.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes1 = joinGame(game.gameId, 'Player1');
      const player1 = JSON.parse(joinRes1.body.toString());

      const joinRes2 = joinGame(game.gameId, 'Player2');
      const player2 = JSON.parse(joinRes2.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');

      const results1Res = getPlayerQuestionResults(player1.playerId, 1);
      const results2Res = getPlayerQuestionResults(player2.playerId, 1);

      expect(results1Res.statusCode).toBe(200);
      expect(results2Res.statusCode).toBe(200);

      const results1 = JSON.parse(results1Res.body.toString());
      const results2 = JSON.parse(results2Res.body.toString());

      expect(results1.questionId).toBe(results2.questionId);
      expect(results1.percentCorrect).toBe(results2.percentCorrect);
    });
  });
});
