import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../../src_ts/interfaces';
import {
  expectError,
  registerUser,
  createQuiz,
  clearData,
  questionCreateRes,
  startGame,
  joinGame,
  gameStatus,
  quizInfo,
  expectedStatusCode,
  updateGameState
} from './../../test_helper_functions';

let sessionId: string, quizId: number, gameId: number;

describe('adminQuizGameStatus', () => {
  beforeEach(() => {
    clearData();
    sessionId = (registerUser('thisEmail@gmail.com', 'thisIsStrongPass99', 'Tom', 'Cruise') as
      RegisterSuccessResponse).session;
    // Creating a new quiz
    quizId = (createQuiz(sessionId, 'General Knowledge quiz',
      'A description of my quiz') as QuizCreateSuccessResponse).quizId;

    questionCreateRes(sessionId, 'where is the moon', 7, 4, [{ answer: 'sky', correct: true },
      { answer: 'sea', correct: false }], quizId, 'https://hello.jpg');

    const res = startGame(sessionId, quizId, 3);
    gameId = JSON.parse(res.body.toString()).gameId;
  });

  describe('successful tests', () => {
    test('successful return of test - 2 players', () => {
      joinGame(gameId, 'Georgia');
      joinGame(gameId, 'James');

      const res = gameStatus(sessionId, quizId, gameId);
      const obj = JSON.parse(res.body.toString());
      const resInfo = quizInfo(sessionId, quizId);
      const objInfo = JSON.parse(resInfo.body.toString());
      expect(obj).toStrictEqual({
        state: 'LOBBY',
        atQuestion: 1,
        players: [
          'Georgia',
          'James'
        ],
        metadata: objInfo
      });
      expectedStatusCode(res, 200);
    });

    test('successful return of test with no players', () => {
      const res = gameStatus(sessionId, quizId, gameId);
      const obj = JSON.parse(res.body.toString());
      const resInfo = quizInfo(sessionId, quizId);
      const objInfo = JSON.parse(resInfo.body.toString());
      expect(obj).toStrictEqual({
        state: 'LOBBY',
        atQuestion: 1,
        players: [],
        metadata: objInfo
      });
      expect(res.statusCode).toBe(200);
    });

    test('successful return of test with no players and END game state', () => {
      updateGameState(sessionId, quizId, gameId, 'END');
      const res = gameStatus(sessionId, quizId, gameId);
      const obj = JSON.parse(res.body.toString());
      const resInfo = quizInfo(sessionId, quizId);
      const objInfo = JSON.parse(resInfo.body.toString());
      expect(obj).toStrictEqual({
        state: 'END',
        atQuestion: 1,
        players: [],
        metadata: objInfo
      });
      expect(res.statusCode).toBe(200);
    });

    test('successful return of test - 2 players in QUESTION_COUNTDOWN', () => {
      joinGame(gameId, 'Maha');
      joinGame(gameId, 'Shahad');
      updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
      const res = gameStatus(sessionId, quizId, gameId);
      const obj = JSON.parse(res.body.toString());
      const resInfo = quizInfo(sessionId, quizId);
      const objInfo = JSON.parse(resInfo.body.toString());
      expect(obj).toStrictEqual({
        state: 'QUESTION_COUNTDOWN',
        atQuestion: 1,
        players: [
          'Maha',
          'Shahad'
        ],
        metadata: objInfo
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('invalid tests', () => {
    test('INVALID_GAME_ID', () => {
      joinGame(gameId, 'James');
      const res = gameStatus(sessionId, quizId, gameId + 1);
      expectError(res, 400);
    });

    test('UNAUTHORISED', () => {
      joinGame(gameId, 'Mark');
      const res = gameStatus(sessionId + 1, quizId, gameId);
      expectError(res, 401);
    });

    test('INVALID_QUIZ_ID', () => {
      joinGame(gameId, 'Mark');
      const res = gameStatus(sessionId, quizId + 1, gameId);
      expectError(res, 403);
    });
  });
});
