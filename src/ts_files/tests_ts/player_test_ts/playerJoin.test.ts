import {
  registerUser,
  loginUserBody,
  createQuiz,
  questionCreateId,
  startGame,
  clearData,
  expectSuccessGameStart,
  joinGame,
  getPlayerStatus,
  updateGameState,
  expectedStatusCode
} from '../test_helper_functions';

describe('playerJoin', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test('successfully joins game with valid gameId and playerName', () => {
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
      expectedStatusCode(joinRes, 200);
      expect(joinResult).toEqual({
        playerId: expect.any(Number)
      });
      expect(joinResult.playerId).toBeGreaterThan(0);
    });

    test('multiple players can join the same game with different names', () => {
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

      const joinRes3 = joinGame(game.gameId, 'Player3');
      const joinResult3 = JSON.parse(joinRes3.body.toString());

      expect(joinResult1.playerId).not.toBe(joinResult2.playerId);
      expect(joinResult2.playerId).not.toBe(joinResult3.playerId);
    });

    test('joins game with playerName containing alphanumeric and spaces', () => {
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

      joinGame(game.gameId, 'Player123');
      joinGame(game.gameId, 'Test Player');
      const joinRes3 = joinGame(game.gameId, 'ABC 123 XYZ');

      expectedStatusCode(joinRes3, 200);
    });
    test('create random playerName - empty playerName', () => {
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

      const joinRes = joinGame(game.gameId, '');
      const joinResult = JSON.parse(joinRes.body.toString());

      expect(joinRes.statusCode).toBe(200);
      expect(joinResult).toEqual({
        playerId: expect.any(Number)
      });
    });
  });

  describe('Error Cases', () => {
    test('returns error for invalid gameId', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Quiz Title', 'Quiz Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'What is 3+3?',
        30,
        10,
        [{ answer: '6', correct: true }, { answer: '5', correct: false }],
        quiz.quizId,
        'https://example.com/image.png'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 5);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId + 1, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      expectedStatusCode(joinRes, 400);
      expect(joinResult).toEqual({
        error: 'INVALID_GAME_ID',
        message: expect.any(String)
      });
    });

    test('returns error for invalid gameId - negative ID', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Quiz Title', 'Quiz Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'What is 3+3?',
        30,
        10,
        [{ answer: '6', correct: true }, { answer: '5', correct: false }],
        quiz.quizId,
        'https://example.com/image.png'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 5);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(-Math.abs(game.gameId), 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      expect(joinResult).toEqual({
        error: 'INVALID_GAME_ID',
        message: expect.any(String)
      });
    });

    test('returns error for invalid playerName - contains invalid characters', () => {
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

      const invalidNames = ['Player@123', 'Test#Player', 'Player!', 'Test$User', 'Player%'];

      for (const invalidName of invalidNames) {
        const joinRes = joinGame(game.gameId, invalidName);
        const joinResult = JSON.parse(joinRes.body.toString());

        expectedStatusCode(joinRes, 400);
        expect(joinResult).toEqual({
          error: 'INVALID_PLAYER_NAME',
          message: expect.any(String)
        });
      }
    });

    test('returns error for duplicate playerName in same game', () => {
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

      joinGame(game.gameId, 'SameName');

      const joinRes2 = joinGame(game.gameId, 'SameName');
      const joinResult2 = JSON.parse(joinRes2.body.toString());

      expectedStatusCode(joinRes2, 400);
      expect(joinResult2).toEqual({
        error: 'INVALID_PLAYER_NAME',
        message: expect.any(String)
      });
    });

    test('returns error when game is not in LOBBY state', () => {
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

      joinGame(game.gameId, 'InitialPlayer');

      updateGameState(
        userSession.session,
        quiz.quizId,
        game.gameId,
        'NEXT_QUESTION'
      );

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      expectedStatusCode(joinRes, 400);
      expect(joinResult).toEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });
  });

  describe('Side Effect Cases', () => {
    test('player can be found via playerStatus after joining', () => {
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

      const statusRes = getPlayerStatus(joinResult.playerId);

      expectedStatusCode(statusRes, 200);
      const statusResult = JSON.parse(statusRes.body.toString());
      expect(statusResult).toEqual({
        state: 'LOBBY',
        numQuestions: 1,
        atQuestion: 1
      });
    });

    test('joining game does not affect other games', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz1 = createQuiz(userSession.session, 'Quiz 1', 'Description 1');
      if ('error' in quiz1) {
        throw new Error(`Quiz creation failed: ${quiz1.error}`);
      }
      questionCreateId(
        userSession.session,
        'Question 1?',
        30,
        5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz1.quizId,
        'https://example.com/image.jpg'
      );
      const gameRes1 = startGame(userSession.session, quiz1.quizId, 10);
      const game1 = JSON.parse(gameRes1.body.toString());

      const quiz2 = createQuiz(userSession.session, 'Quiz 2', 'Description 2');
      if ('error' in quiz2) {
        throw new Error(`Quiz creation failed: ${quiz2.error}`);
      }
      questionCreateId(
        userSession.session,
        'Question 2?',
        45,
        10,
        [{ answer: 'C', correct: true }, { answer: 'D', correct: false }],
        quiz2.quizId,
        'https://example.com/image.jpg'
      );
      const gameRes2 = startGame(userSession.session, quiz2.quizId, 5);
      const game2 = JSON.parse(gameRes2.body.toString());

      const joinRes1 = joinGame(game1.gameId, 'PlayerInGame1');

      const joinRes2 = joinGame(game2.gameId, 'PlayerInGame2');

      const result1 = JSON.parse(joinRes1.body.toString());
      const result2 = JSON.parse(joinRes2.body.toString());
      expect(result1.playerId).not.toBe(result2.playerId);
    });
  });
});
