import {
  registerUser,
  loginUserBody,
  createQuiz,
  questionCreateId,
  startGame,
  clearData,
  expectSuccessGameStart,
  joinGame,
  getPlayerGameResults,
  updateGameState
} from './../test_helper_functions';

describe('playerGameResults', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test('returns game results for single player with single question', () => {
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
      expectSuccessGameStart(gameRes);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_FINAL_RESULTS');

      const resultsRes = getPlayerGameResults(joinResult.playerId);

      expect(resultsRes.statusCode).toBe(200);
      const resultsData = JSON.parse(resultsRes.body.toString());

      expect(resultsData).toEqual({
        usersRankedByScore: expect.arrayContaining([
          expect.objectContaining({
            playerName: 'TestPlayer',
            score: expect.any(Number)
          })
        ]),
        questionResults: expect.arrayContaining([
          expect.objectContaining({
            questionId: expect.any(Number),
            playersCorrect: expect.any(Array),
            averageAnswerTime: expect.any(Number),
            percentCorrect: expect.any(Number)
          })
        ])
      });
    });

    test('returns correct ranking for multiple players with different scores', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Multi Player Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'Easy question?',
        30,
        10,
        [
          { answer: 'Correct Answer', correct: true },
          { answer: 'Wrong Answer', correct: false }
        ],
        quiz.quizId,
        'https://example.com/easy.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes1 = joinGame(game.gameId, 'HighScorePlayer');
      const joinResult1 = JSON.parse(joinRes1.body.toString());

      const joinRes2 = joinGame(game.gameId, 'MediumScorePlayer');
      JSON.parse(joinRes2.body.toString());

      const joinRes3 = joinGame(game.gameId, 'LowScorePlayer');
      JSON.parse(joinRes3.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_FINAL_RESULTS');

      const resultsRes = getPlayerGameResults(joinResult1.playerId);

      expect(resultsRes.statusCode).toBe(200);
      const resultsData = JSON.parse(resultsRes.body.toString());

      expect(resultsData.usersRankedByScore).toHaveLength(3);

      const scores = resultsData.usersRankedByScore.map(
        (player: { playerName: string; score: number }) => player.score
      );

      const sortedScores = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sortedScores);
    });

    test('returns correct question results for multiple questions', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Multi Question Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'First question?',
        30,
        5,
        [{ answer: 'Answer1', correct: true }, { answer: 'Wrong1', correct: false }],
        quiz.quizId,
        'https://example.com/q1.jpg'
      );

      questionCreateId(
        userSession.session,
        'Second question?',
        45,
        10,
        [{ answer: 'Answer2', correct: true }, { answer: 'Wrong2', correct: false }],
        quiz.quizId,
        'https://example.com/q2.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_FINAL_RESULTS');

      const resultsRes = getPlayerGameResults(joinResult.playerId);

      expect(resultsRes.statusCode).toBe(200);
      const resultsData = JSON.parse(resultsRes.body.toString());

      expect(resultsData.questionResults).toHaveLength(2);

      resultsData.questionResults.forEach(
        (
          questionResult: {
            questionId: number;
            playersCorrect: string[];
            averageAnswerTime: number;
            percentCorrect: number;
          }
        ) => {
          expect(questionResult).toEqual({
            questionId: expect.any(Number),
            playersCorrect: expect.any(Array),
            averageAnswerTime: expect.any(Number),
            percentCorrect: expect.any(Number)
          });

          expect(questionResult.percentCorrect).toBeGreaterThanOrEqual(0);
          expect(questionResult.percentCorrect).toBeLessThanOrEqual(100);

          expect(questionResult.averageAnswerTime).toBeGreaterThanOrEqual(0);
        });
    });

    test('returns empty results for game with no players answered', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'No Answer Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'Unanswered question?',
        30,
        5,
        [{ answer: 'Answer', correct: true }, { answer: 'Wrong', correct: false }],
        quiz.quizId,
        'https://example.com/unanswered.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'NoAnswerPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      updateGameState(userSession.session, quiz.quizId, game.gameId, 'NEXT_QUESTION');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_ANSWER');
      updateGameState(userSession.session, quiz.quizId, game.gameId, 'GO_TO_FINAL_RESULTS');

      const resultsRes = getPlayerGameResults(joinResult.playerId);

      expect(resultsRes.statusCode).toBe(200);
      const resultsData = JSON.parse(resultsRes.body.toString());

      expect(resultsData.usersRankedByScore).toEqual([
        expect.objectContaining({
          playerName: 'NoAnswerPlayer',
          score: 0
        })
      ]);

      expect(resultsData.questionResults[0]).toEqual(
        expect.objectContaining({
          playersCorrect: [],
          percentCorrect: 0
        })
      );
    });
  });

  describe('Error Cases', () => {
    test('returns error for invalid player ID - non-existent', () => {
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
        [{ answer: 'Answer', correct: true }, { answer: 'Wrong', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const nonExistentPlayerId = joinResult.playerId + 1;
      const resultsRes = getPlayerGameResults(nonExistentPlayerId);

      expect(resultsRes.statusCode).toBe(400);
      const errorData = JSON.parse(resultsRes.body.toString());

      expect(errorData).toEqual({
        error: 'INVALID_PLAYER_ID',
        message: expect.any(String)
      });
    });

    test('returns error for invalid player ID - negative number', () => {
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
        [{ answer: 'Answer', correct: true }, { answer: 'Wrong', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const negativePlayerId = -Math.abs(joinResult.playerId);
      const resultsRes = getPlayerGameResults(negativePlayerId);

      expect(resultsRes.statusCode).toBe(400);
      const errorData = JSON.parse(resultsRes.body.toString());

      expect(errorData).toEqual({
        error: 'INVALID_PLAYER_ID',
        message: expect.any(String)
      });
    });

    test('returns error when game is not in FINAL_RESULTS state - LOBBY', () => {
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
        [{ answer: 'Answer', correct: true }, { answer: 'Wrong', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const resultsRes = getPlayerGameResults(joinResult.playerId);

      expect(resultsRes.statusCode).toBe(400);
      const errorData = JSON.parse(resultsRes.body.toString());

      expect(errorData).toEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });

    test('returns error when game is in END state', () => {
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
        [{ answer: 'Answer', correct: true }, { answer: 'Wrong', correct: false }],
        quiz.quizId,
        'https://example.com/test.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'TestPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const resultsRes = getPlayerGameResults(joinResult.playerId);

      expect(resultsRes.statusCode).toBe(400);
      const errorData = JSON.parse(resultsRes.body.toString());

      expect(errorData).toEqual({
        error: 'INCOMPATIBLE_GAME_STATE',
        message: expect.any(String)
      });
    });
  });

  describe('Side Effect Cases', () => {
    test('multiple calls return consistent results', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Consistent Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'Consistent question?',
        30,
        5,
        [{ answer: 'Answer', correct: true }, { answer: 'Wrong', correct: false }],
        quiz.quizId,
        'https://example.com/consistent.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes = joinGame(game.gameId, 'ConsistentPlayer');
      const joinResult = JSON.parse(joinRes.body.toString());

      const resultsRes1 = getPlayerGameResults(joinResult.playerId);
      const resultsRes2 = getPlayerGameResults(joinResult.playerId);
      const resultsRes3 = getPlayerGameResults(joinResult.playerId);

      if (resultsRes1.statusCode === 200) {
        const results1 = JSON.parse(resultsRes1.body.toString());
        const results2 = JSON.parse(resultsRes2.body.toString());
        const results3 = JSON.parse(resultsRes3.body.toString());

        expect(results1).toEqual(results2);
        expect(results2).toEqual(results3);
      } else {
        expect(resultsRes1.statusCode).toBe(resultsRes2.statusCode);
        expect(resultsRes2.statusCode).toBe(resultsRes3.statusCode);
      }
    });

    test('different players in same game return same results', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz = createQuiz(userSession.session, 'Same Game Quiz', 'Test Description');
      if ('error' in quiz) {
        throw new Error(`Quiz creation failed: ${quiz.error}`);
      }

      questionCreateId(
        userSession.session,
        'Same game question?',
        30,
        5,
        [{ answer: 'Answer', correct: true }, { answer: 'Wrong', correct: false }],
        quiz.quizId,
        'https://example.com/samegame.jpg'
      );

      const gameRes = startGame(userSession.session, quiz.quizId, 10);
      const game = JSON.parse(gameRes.body.toString());

      const joinRes1 = joinGame(game.gameId, 'Player1');
      const joinResult1 = JSON.parse(joinRes1.body.toString());

      const joinRes2 = joinGame(game.gameId, 'Player2');
      const joinResult2 = JSON.parse(joinRes2.body.toString());

      const resultsRes1 = getPlayerGameResults(joinResult1.playerId);
      const resultsRes2 = getPlayerGameResults(joinResult2.playerId);

      expect(resultsRes1.statusCode).toBe(resultsRes2.statusCode);

      if (resultsRes1.statusCode === 200) {
        const results1 = JSON.parse(resultsRes1.body.toString());
        const results2 = JSON.parse(resultsRes2.body.toString());

        expect(results1).toEqual(results2);
      }
    });

    test('players from different games have different results', () => {
      registerUser('test@example.com', 'password123', 'Test', 'User');
      const userSession = loginUserBody('test@example.com', 'password123');

      const quiz1 = createQuiz(userSession.session, 'Game 1 Quiz', 'Description 1');
      if ('error' in quiz1) {
        throw new Error(`Quiz creation failed: ${quiz1.error}`);
      }

      questionCreateId(
        userSession.session,
        'Game 1 question?',
        30,
        5,
        [{ answer: 'G1Answer', correct: true }, { answer: 'G1Wrong', correct: false }],
        quiz1.quizId,
        'https://example.com/game1.jpg'
      );

      const gameRes1 = startGame(userSession.session, quiz1.quizId, 10);
      const game1 = JSON.parse(gameRes1.body.toString());

      const quiz2 = createQuiz(userSession.session, 'Game 2 Quiz', 'Description 2');
      if ('error' in quiz2) {
        throw new Error(`Quiz creation failed: ${quiz2.error}`);
      }

      questionCreateId(
        userSession.session,
        'Game 2 question?',
        45,
        10,
        [{ answer: 'G2Answer', correct: true }, { answer: 'G2Wrong', correct: false }],
        quiz2.quizId,
        'https://example.com/game2.jpg'
      );

      const gameRes2 = startGame(userSession.session, quiz2.quizId, 10);
      const game2 = JSON.parse(gameRes2.body.toString());

      const joinRes1 = joinGame(game1.gameId, 'Game1Player');
      const joinResult1 = JSON.parse(joinRes1.body.toString());

      const joinRes2 = joinGame(game2.gameId, 'Game2Player');
      const joinResult2 = JSON.parse(joinRes2.body.toString());

      const resultsRes1 = getPlayerGameResults(joinResult1.playerId);
      const resultsRes2 = getPlayerGameResults(joinResult2.playerId);

      expect(resultsRes1.statusCode).toBe(resultsRes2.statusCode);

      if (resultsRes1.statusCode === 200) {
        const results1 = JSON.parse(resultsRes1.body.toString());
        const results2 = JSON.parse(resultsRes2.body.toString());

        expect(
          results1.usersRankedByScore[0].playerName
        ).not.toBe(
          results2.usersRankedByScore[0].playerName
        );
      }
    });
  });
});
