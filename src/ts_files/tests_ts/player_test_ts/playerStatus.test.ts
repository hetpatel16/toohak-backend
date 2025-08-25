import {
  registerUser,
  loginUserBody,
  createQuiz,
  questionCreateId,
  startGame,
  clearData,
  expectSuccessGameStart,
  getPlayerStatus,
  joinGame
} from './../test_helper_functions';

describe('playerStatus', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test('returns correct status for player in LOBBY state', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Test Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'What is 2+2?',
        30,
        5,
        [
          { answer: '4', correct: true },
          { answer: '5', correct: false }
        ],
        quiz.quizId,
        'https://example.com/image.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      expectSuccessGameStart(gameRes);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const statusRes = getPlayerStatus(joinResult.playerId);
      const statusResult = JSON.parse(statusRes.body.toString());

      expect(statusRes.statusCode).toBe(200);
      expect(statusResult).toEqual({
        state: 'LOBBY',
        numQuestions: 1,
        atQuestion: 1
      });
    });

    test('returns correct status for player with multiple questions', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Multi Question Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'Question 1?',
        30,
        5,
        [{ answer: 'A1', correct: true }, { answer: 'A2', correct: false }],
        quiz.quizId,
        'https://example.com/image1.jpg'
      );
      questionCreateId(
        userSession.session,
        'Question 2?',
        45,
        10,
        [{ answer: 'B1', correct: false }, { answer: 'B2', correct: true }],
        quiz.quizId,
        'https://example.com/image2.jpg'
      );
      questionCreateId(
        userSession.session,
        'Question 3?',
        60,
        10,
        [{ answer: 'C1', correct: true }, { answer: 'C2', correct: false }],
        quiz.quizId,
        'https://example.com/image3.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const statusRes = getPlayerStatus(joinResult.playerId);
      const statusResult = JSON.parse(statusRes.body.toString());

      expect(statusResult).toEqual({
        state: 'LOBBY',
        numQuestions: 3,
        atQuestion: 1
      });
    });
  });

  describe('Error Cases', () => {
    test('returns error for invalid player ID - non-existent ID', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Test Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'What is 2+2?',
        30,
        5,
        [{ answer: '4', correct: true }, { answer: '5', correct: false }],
        quiz.quizId,
        'https://example.com/image.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const statusRes = getPlayerStatus(joinResult.playerId + 1);
      const statusResult = JSON.parse(statusRes.body.toString());

      expect(statusRes.statusCode).toBe(400);
      expect(statusResult).toEqual({
        error: 'INVALID_PLAYER_ID',
        message: expect.any(String)
      });
    });

    test('returns error for invalid player ID - negative ID', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Test Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

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

      const statusRes = getPlayerStatus(-Math.abs(joinResult.playerId));
      const statusResult = JSON.parse(statusRes.body.toString());

      expect(statusResult).toEqual({
        error: 'INVALID_PLAYER_ID',
        message: expect.any(String)
      });
    });
  });

  describe('Side Effect Cases', () => {
    test('player status remains consistent across multiple calls', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Test Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'What is 2+2?',
        30,
        5,
        [{ answer: '4', correct: true }, { answer: '5', correct: false }],
        quiz.quizId,
        'https://example.com/image.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const statusRes1 = getPlayerStatus(joinResult.playerId);
      const statusResult1 = JSON.parse(statusRes1.body.toString());

      const statusRes2 = getPlayerStatus(joinResult.playerId);
      JSON.parse(statusRes2.body.toString());

      const statusRes3 = getPlayerStatus(joinResult.playerId);
      JSON.parse(statusRes3.body.toString());

      expect(statusResult1).toEqual({
        state: 'LOBBY',
        numQuestions: 1,
        atQuestion: 1
      });
    });

    test('different players have independent status calls', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Test Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'What is 2+2?',
        30,
        5,
        [{ answer: '4', correct: true }, { answer: '5', correct: false }],
        quiz.quizId,
        'https://example.com/image.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes1 = joinGame(game.gameId, 'Player1');
      const joinResult1 = JSON.parse(joinRes1.body.toString());

      const joinRes2 = joinGame(game.gameId, 'Player2');
      const joinResult2 = JSON.parse(joinRes2.body.toString());

      const statusRes1 = getPlayerStatus(joinResult1.playerId);
      const statusResult1 = JSON.parse(statusRes1.body.toString());

      const statusRes2 = getPlayerStatus(joinResult2.playerId);
      JSON.parse(statusRes2.body.toString());

      expect(statusResult1).toEqual({
        state: 'LOBBY',
        numQuestions: 1,
        atQuestion: 1
      });

      expect(joinResult1.playerId).not.toBe(joinResult2.playerId);
    });
  });
});
