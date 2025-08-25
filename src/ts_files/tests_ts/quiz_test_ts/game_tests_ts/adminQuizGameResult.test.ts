import {
  QuizCreateSuccessResponse,
  RegisterSuccessResponse
} from '../../../src_ts/interfaces'; import {
  expectError,
  registerUser,
  createQuiz,
  clearData,
  startGame,
  joinGame,
  updateGameState,
  gameStatus,
  gameResult,
  questionCreateRes,
  submitPlayerAnswerRes,
  viewGame
} from './../../test_helper_functions';
import slync from 'slync';

let sessionId: string;
let quizId: number, gameId : number, playerId: number, questionPosition: number;

describe('adminQuizGamerResult', () => {
  beforeEach(() => {
    clearData();
    sessionId = (registerUser('thisEmail@gmail.com', 'thisIsStrongPass99', 'Tom', 'Cruise') as
      RegisterSuccessResponse).session;
    // Creating a new quiz
    quizId = (createQuiz(sessionId, 'General Knowledge quiz',
      'A description of my quiz') as QuizCreateSuccessResponse).quizId;

    questionCreateRes(
      sessionId,
      'Where is the moon>',
      30,
      5,
      [
        { answer: 'Sky', correct: true },
        { answer: 'Sea', correct: false },
      ],
      quizId,
      'http://example.com/image.jpg'
    );

    const gamaeStartRes = startGame(sessionId, quizId, 1);
    gameId = JSON.parse(gamaeStartRes.body.toString()).gameId;
    questionPosition = JSON.parse(gamaeStartRes.body.toString()).atQuestion;

    const playerJoinRes = joinGame(gameId, 'Madea');
    playerId = JSON.parse(playerJoinRes.body.toString()).playerId;
  });

  describe('successful cases', () => {
    test('finish game successfully and get results', () => {
      // play the game
      updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION'); // at QUESITON_COUNTDOWN
      updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN'); // at QUESTION_OPEN

      // quesiton timer starts
      // submit an answer
      submitPlayerAnswerRes(playerId, [1], questionPosition); // Sky - correct answer

      updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER'); // at ANSWER_SHOW
      updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS'); // at FINAL_RESULTS

      const res = gameResult(sessionId, quizId, gameId);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({
        usersRankedByScore: [
          {
            playerName: 'Madea',
            score: expect.any(Number)
          }
        ],
        questionResults: [
          {
            questionId: expect.any(Number),
            playersCorrect: expect.any(Array),
            averageAnswerTime: expect.any(Number),
            percentCorrect: expect.any(Number)
          }
        ]
      });
    });
    test('finish game successfully and get results - two players', () => {
      // start new game
      const playerJoinRes = joinGame(gameId, 'Shahi');
      const playerIdTwo = JSON.parse(playerJoinRes.body.toString()).playerId;

      updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION'); // gameOne at QUESTION_COUNTDOWN
      slync(3 * 1000); // don't skip countdown inside gameOne

      submitPlayerAnswerRes(playerId, [1], questionPosition); // playerOne submit correct answer
      submitPlayerAnswerRes(playerIdTwo, [2], questionPosition); // playerTwo submit wrong answer

      updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER'); // at ANSWER_SHOW
      updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS'); // at FINAL_RESULTS

      const res = gameResult(sessionId, quizId, gameId);
      const body = JSON.parse(res.body.toString());
      expect(body).toStrictEqual({
        usersRankedByScore: [
          {
            playerName: 'Madea',
            score: expect.any(Number)
          },
          {
            playerName: 'Shahi',
            score: expect.any(Number)
          }
        ],
        questionResults: [
          {
            questionId: expect.any(Number),
            playersCorrect: expect.any(Array),
            averageAnswerTime: expect.any(Number),
            percentCorrect: expect.any(Number)
          }
        ]
      });
    });
    test('finish two games and get their results', () => {
      // start gameTwo
      const gamaeStartRes = startGame(sessionId, quizId, 1);
      const gameIdTwo = JSON.parse(gamaeStartRes.body.toString()).gameId;

      const playerJoinRes = joinGame(gameIdTwo, 'Shahi');
      const playerIdTwo = JSON.parse(playerJoinRes.body.toString()).playerId;

      // test side effect
      const activeGames = JSON.parse(
        viewGame(sessionId, quizId).body.toString()).activeGames;
      expect(activeGames.length).toBeGreaterThan(0);

      // play gameTwo
      updateGameState(sessionId, quizId, gameIdTwo, 'NEXT_QUESTION'); // at QUESITON_COUNTDOWN
      updateGameState(sessionId, quizId, gameIdTwo, 'SKIP_COUNTDOWN'); // at QUESTION_OPEN

      // quesiton timer starts
      // submit an answer
      submitPlayerAnswerRes(playerIdTwo, [1], questionPosition); // Sky - correct answer

      updateGameState(sessionId, quizId, gameIdTwo, 'GO_TO_ANSWER'); // at ANSWER_SHOW
      updateGameState(sessionId, quizId, gameIdTwo, 'GO_TO_FINAL_RESULTS'); // at FINAL_RESULTS

      // result of gameTwo
      const resGameTwo = gameResult(sessionId, quizId, gameIdTwo);
      const bodyResultTwo = JSON.parse(resGameTwo.body.toString());
      expect(bodyResultTwo).toStrictEqual({
        usersRankedByScore: [
          {
            playerName: 'Shahi',
            score: expect.any(Number)
          }
        ],
        questionResults: [
          {
            questionId: expect.any(Number),
            playersCorrect: expect.any(Array),
            averageAnswerTime: expect.any(Number),
            percentCorrect: expect.any(Number)
          }
        ]
      });

      // play gameOne
      updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION'); // at QUESITON_COUNTDOWN
      updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN'); // at QUESTION_OPEN

      // quesiton timer starts
      // submit an answer
      submitPlayerAnswerRes(playerId, [1], questionPosition); // Sky - correct answer

      updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER'); // at ANSWER_SHOW
      updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS'); // at FINAL_RESULTS

      const resGameOne = gameResult(sessionId, quizId, gameId);
      const bodyResultOne = JSON.parse(resGameOne.body.toString());
      expect(bodyResultOne).toStrictEqual({
        usersRankedByScore: [
          {
            playerName: 'Madea',
            score: expect.any(Number)
          }
        ],
        questionResults: [
          {
            questionId: expect.any(Number),
            playersCorrect: expect.any(Array),
            averageAnswerTime: expect.any(Number),
            percentCorrect: expect.any(Number)
          }
        ]
      });
    });
  });

  describe('invalid  cases', () => {
    test('INVALID_GAME_ID', () => {
      updateGameState(sessionId, quizId, gameId, 'END');
      const res = gameResult(sessionId, quizId, gameId + 1);
      expect(JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()).gameStatus)
        .not.toBe('FINAL_RESULTS');
      expectError(res, 400);
    });

    test('INCOMPATIBLE_GAME_STATE - game at LOBBY', () => {
      // game is still in lobby
      const res = gameResult(sessionId, quizId, gameId);
      expectError(res, 400);
    });
    test('INCOMPATIBLE_GAME_STATE - game at QUESTION_OPEN', () => {
      updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION'); // at QUESITON_COUNTDOWN
      updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN'); // at QUESTION_OPEN

      // quesiton timer starts
      // submit an answer
      submitPlayerAnswerRes(playerId, [1], questionPosition); // Sky - correct answer

      const res = gameResult(sessionId, quizId, gameId);
      expectError(res, 400);
    });
    test('INCOMPATIBLE_GAME_STATE - game at END', () => {
      updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION'); // at QUESITON_COUNTDOWN
      updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN'); // at QUESTION_OPEN

      // quesiton timer starts
      // submit an answer
      submitPlayerAnswerRes(playerId, [1], questionPosition); // Sky - correct answer

      updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER'); // at ANSWER_SHOW
      updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS'); // at FINAL_RESULTS
      updateGameState(sessionId, quizId, gameId, 'END'); // at END

      const res = gameResult(sessionId, quizId, gameId);
      expectError(res, 400);
    });

    test('UNAUTHORISED', () => {
      const res = gameResult(sessionId + 1, quizId, gameId);
      expectError(res, 401);
    });

    test('INVALID_QUIZ_ID', () => {
      const res = gameResult(sessionId, quizId + 1, gameId);
      expectError(res, 403);
    });
  });
});
