import {
  registerUser,
  loginUserBody,
  createQuiz,
  questionCreateId,
  startGame,
  clearData,
  joinGame,
  getPlayerQuestionInfo,
  getPlayerStatus,
  updateGameState
} from '../test_helper_functions';

describe('playerQuestionInfo', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test(
      'returns question info for valid player and question position ' +
      'when game is in QUESTION_OPEN state',
      () => {
        registerUser('test@example.com', 'password123', 'Test', 'User');
        const userSession = loginUserBody('test@example.com', 'password123');

        const quiz = createQuiz(userSession.session, 'Test Quiz', 'Test Description');
        if ('error' in quiz) {
          throw new Error(`Quiz creation failed: ${quiz.error}`);
        }

        questionCreateId(
          userSession.session,
          'What is the capital of Australia?',
          30,
          5,
          [
            { answer: 'Sydney', correct: false },
            { answer: 'Melbourne', correct: false },
            { answer: 'Canberra', correct: true },
            { answer: 'Brisbane', correct: false }
          ],
          quiz.quizId,
          'https://example.com/australia.jpg'
        );

        const gameRes = startGame(userSession.session, quiz.quizId, 10);
        const game = JSON.parse(gameRes.body.toString());

        const joinRes = joinGame(game.gameId, 'TestPlayer');
        const joinResult = JSON.parse(joinRes.body.toString());

        updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
        updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

        const questionRes = getPlayerQuestionInfo(joinResult.playerId, 1);
        const questionResult = JSON.parse(questionRes.body.toString());

        expect(questionRes.statusCode).toBe(200);
        expect(questionResult).toEqual({
          questionId: expect.any(Number),
          question: 'What is the capital of Australia?',
          timeLimit: 30,
          thumbnailUrl: 'https://example.com/australia.jpg',
          points: 5,
          answerOptions: expect.arrayContaining([
            {
              answerId: expect.any(Number),
              answer: 'Sydney',
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'Melbourne',
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'Canberra',
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'Brisbane',
              colour: expect.any(String)
            }
          ])
        });

        expect(questionResult.answerOptions).toHaveLength(4);
      });

    test(
      'returns info for different positions in multi-question quiz',
      () => {
        registerUser('test@example.com', 'password123', 'Test', 'User');
        const userSession = loginUserBody('test@example.com', 'password123');

        const quiz = createQuiz(userSession.session, 'Multi Question Quiz', 'Test Description');
        if ('error' in quiz) {
          throw new Error(`Quiz creation failed: ${quiz.error}`);
        }

        questionCreateId(
          userSession.session,
          'What is 2+2?',
          30,
          5,
          [
            { answer: '3', correct: false },
            { answer: '4', correct: true }
          ],
          quiz.quizId,
          'https://example.com/math1.jpg'
        );

        questionCreateId(
          userSession.session,
          'What is the color of the sky?',
          45,
          10,
          [
            { answer: 'Blue', correct: true },
            { answer: 'Red', correct: false },
            { answer: 'Green', correct: false }
          ],
          quiz.quizId,
          'https://example.com/sky.jpg'
        );

        questionCreateId(
          userSession.session,
          'How many legs does a spider have?',
          60,
          10,
          [
            { answer: '6', correct: false },
            { answer: '8', correct: true },
            { answer: '10', correct: false }
          ],
          quiz.quizId,
          'https://example.com/spider.jpg'
        );

        const gameRes = startGame(userSession.session, quiz.quizId, 10);
        const game = JSON.parse(gameRes.body.toString());

        const joinRes = joinGame(game.gameId, 'TestPlayer');
        const joinResult = JSON.parse(joinRes.body.toString());

        updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
        updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

        const q1Res = getPlayerQuestionInfo(joinResult.playerId, 1);
        const q1Result = JSON.parse(q1Res.body.toString());

        expect(q1Result.question).toBe('What is 2+2?');
        expect(q1Result.timeLimit).toBe(30);
        expect(q1Result.points).toBe(5);

        updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');
        updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
        updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

        const q2Res = getPlayerQuestionInfo(joinResult.playerId, 2);
        const q2Result = JSON.parse(q2Res.body.toString());

        expect(q2Result.question).toBe('What is the color of the sky?');

        updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');
        updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
        updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

        const q3Res = getPlayerQuestionInfo(joinResult.playerId, 3);
        const q3Result = JSON.parse(q3Res.body.toString());

        expect(q3Result.question).toBe('How many legs does a spider have?');
      });

    test('returns question with correct answer options structure and colors', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Color Test Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'Test question for colors?',
        30,
        5,
        [
          { answer: 'Option A', correct: true },
          { answer: 'Option B', correct: false }
        ],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

      const questionRes = getPlayerQuestionInfo(joinResult.playerId, 1);
      const questionResult = JSON.parse(questionRes.body.toString());

      for (const option of questionResult.answerOptions) {
        expect(option).toHaveProperty('answerId');
        expect(option).toHaveProperty('answer');
        expect(option).toHaveProperty('colour');
        expect(typeof option.answerId).toBe('number');
        expect(typeof option.answer).toBe('string');
        expect(typeof option.colour).toBe('string');
        expect(option).not.toHaveProperty('correct');
      }
    });
  });

  describe('Error Cases', () => {
    test('returns error for invalid player ID - non-existent player', () => {
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

      const questionRes = getPlayerQuestionInfo(joinResult.playerId + 1, 1);
      const questionResult = JSON.parse(questionRes.body.toString());

      expect(questionRes.statusCode).toBe(400);
      expect(questionResult).toEqual({
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

      const questionRes = getPlayerQuestionInfo(-Math.abs(joinResult.playerId), 1);
      const questionResult = JSON.parse(questionRes.body.toString());

      expect(questionResult).toEqual({
        error: 'INVALID_PLAYER_ID',
        message: expect.any(String)
      });
    });

    test('returns error for invalid question position - position too high', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Test Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      const questionsCreated = 1;
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

      const invalidPosition = questionsCreated + 1;
      const questionRes = getPlayerQuestionInfo(joinResult.playerId, invalidPosition);
      const questionResult = JSON.parse(questionRes.body.toString());

      expect(questionRes.statusCode).toBe(400);
      expect(questionResult).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String)
      });
    });

    test('returns error for invalid question position - zero position', () => {
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

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

      const minimumValidPosition = 1;
      const invalidPosition = minimumValidPosition - 1;
      const questionRes = getPlayerQuestionInfo(joinResult.playerId, invalidPosition);
      const questionResult = JSON.parse(questionRes.body.toString());

      expect(questionRes.statusCode).toBe(400);
      expect(questionResult).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String)
      });
    });

    test('returns error for invalid question position - negative position', () => {
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

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

      const minimumValidPosition = 1;
      const invalidPosition = -minimumValidPosition;
      const questionRes = getPlayerQuestionInfo(joinResult.playerId, invalidPosition);
      const questionResult = JSON.parse(questionRes.body.toString());

      expect(questionRes.statusCode).toBe(400);
      expect(questionResult).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String)
      });
    });

    test('returns error when game is in LOBBY state', () => {
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

      const questionRes = getPlayerQuestionInfo(joinResult.playerId, 1);
      const questionResult = JSON.parse(questionRes.body.toString());

      expect(questionRes.statusCode).toBe(400);
      expect(questionResult).toEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });

    test('returns error when trying to access question not currently active', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Multi Question Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      let questionsCreated = 0;
      questionCreateId(userSession.session, 'Question 1?', 30, 5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz.quizId, 'https://example.com/q1.jpg');
      questionsCreated++;

      questionCreateId(userSession.session, 'Question 2?', 30, 5,
        [{ answer: 'C', correct: true }, { answer: 'D', correct: false }],
        quiz.quizId, 'https://example.com/q2.jpg');
      questionsCreated++;

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');

      const lastQuestionPosition = questionsCreated;
      const questionRes = getPlayerQuestionInfo(joinResult.playerId, lastQuestionPosition);
      const questionResult = JSON.parse(questionRes.body.toString());

      expect(questionRes.statusCode).toBe(400);
      expect(questionResult).toEqual({
        error: 'INVALID_POSITION',
        message: expect.any(String)
      });
    });
  });

  describe('Side Effect Cases', () => {
    test('multiple players can access same question info independently', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Shared Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

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
      const joinResult1 = JSON.parse(joinRes1.body.toString());

      const joinRes2 = joinGame(game.gameId, 'Player2');
      const joinResult2 = JSON.parse(joinRes2.body.toString());

      const q1Res = getPlayerQuestionInfo(joinResult1.playerId, 1);
      const q2Res = getPlayerQuestionInfo(joinResult2.playerId, 1);

      if (q1Res.statusCode === 200 && q2Res.statusCode === 200) {
        const q1Result = JSON.parse(q1Res.body.toString());
        const q2Result = JSON.parse(q2Res.body.toString());

        expect(q1Result.question).toBe(q2Result.question);
      }
    });

    test('accessing question info does not modify game state', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'State Test Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'State test question?',
        30,
        5,
        [{ answer: 'A', correct: true }, { answer: 'B', correct: false }],
        quiz.quizId,
        'https://example.com/state.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const statusRes1 = getPlayerStatus(joinResult.playerId);
      const status1 = JSON.parse(statusRes1.body.toString());

      getPlayerQuestionInfo(joinResult.playerId, 1);

      const statusRes2 = getPlayerStatus(joinResult.playerId);
      const status2 = JSON.parse(statusRes2.body.toString());

      expect(status1).toEqual(status2);
    });
  });
});
