import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../../src_ts/interfaces';
import {
  expectError,
  registerUser,
  createQuiz,
  clearData,
  questionCreateRes,
  startGame,
  viewGame,
  updateGameState,
} from './../../test_helper_functions';

let sessionId: string;
let quizId: number;

describe('adminQuizGameView', () => {
  beforeEach(() => {
    clearData();
    sessionId = (registerUser('thisEmail@gmail.com', 'thisIsStrongPass99', 'Tom', 'Cruise') as
      RegisterSuccessResponse).session;
    // Creating a new quiz
    quizId = (createQuiz(sessionId, 'General Knowledge quiz',
      'A description of my quiz') as QuizCreateSuccessResponse).quizId;

    questionCreateRes(sessionId, 'where is the moon', 7, 4, [{ answer: 'sky', correct: true },
      { answer: 'sea', correct: false }], quizId, 'https://hello.jpg');
  });

  describe('successful tests', () => {
    test('view game returns 4 active games and no inactive games', () => {
      startGame(sessionId, quizId, 3);
      startGame(sessionId, quizId, 3);
      startGame(sessionId, quizId, 3);
      startGame(sessionId, quizId, 3);

      const res = viewGame(sessionId, quizId);
      const gameList = JSON.parse(res.body.toString());
      expect(gameList.activeGames.length).toBe(4);
      expect(gameList.inactiveGames.length).toBe(0);
    });
    test('view game returns 2 active games and 2 unactive games', () => {
      const res1 = startGame(sessionId, quizId, 3);
      const res2 = startGame(sessionId, quizId, 3);
      const res3 = startGame(sessionId, quizId, 3);
      const res4 = startGame(sessionId, quizId, 3);

      const game1Id = JSON.parse(res1.body.toString()).gameId;
      const game2Id = JSON.parse(res2.body.toString()).gameId;
      const game3Id = JSON.parse(res3.body.toString()).gameId;
      const game4Id = JSON.parse(res4.body.toString()).gameId;
      // two games are updated to END
      updateGameState(sessionId, quizId, game1Id, 'END');
      updateGameState(sessionId, quizId, game2Id, 'END');

      // Other 2 are not in END
      updateGameState(sessionId, quizId, game3Id, 'QUESTION_COUNTDOWN');
      updateGameState(sessionId, quizId, game4Id, 'QUESTION_COUNTDOWN');
      updateGameState(sessionId, quizId, game4Id, 'QUESTION_OPEN');

      const res = viewGame(sessionId, quizId);
      const gameList = JSON.parse(res.body.toString());
      expect(gameList.activeGames.length).toBe(2);
      expect(gameList.inactiveGames.length).toBe(2);
    });

    test('view game returns 2 inactive games only', () => {
      const res1 = startGame(sessionId, quizId, 3);
      const res2 = startGame(sessionId, quizId, 3);

      const game1Id = JSON.parse(res1.body.toString()).gameId;
      const game2Id = JSON.parse(res2.body.toString()).gameId;

      updateGameState(sessionId, quizId, game1Id, 'END');
      updateGameState(sessionId, quizId, game2Id, 'END');

      const res = viewGame(sessionId, quizId);
      const gameList = JSON.parse(res.body.toString());
      expect(gameList.activeGames.length).toBe(0);
      expect(gameList.inactiveGames.length).toBe(2);
    });

    test('view game returns no active nor inactive games', () => {
      const res = viewGame(sessionId, quizId);
      const gameList = JSON.parse(res.body.toString());
      expect(gameList.activeGames.length).toBe(0);
      expect(gameList.inactiveGames.length).toBe(0);
    });
  });

  describe('invalid tests', () => {
    test('UNAUTHORISED', () => {
      startGame(sessionId, quizId, 3);
      const result = viewGame(sessionId + 1, quizId);
      expectError(result, 401);
    });

    test('INVALID_QUIZ_ID', () => {
      startGame(sessionId, quizId, 3);
      const result = viewGame(sessionId, quizId + 1);
      expectError(result, 403);
    });
  });
});
