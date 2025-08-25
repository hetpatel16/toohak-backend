import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../src_ts/interfaces';
import {
  expectSuccessEmptyObj,
  expectErrorQuiz,
  registerUser,
  createQuiz,
  removeQuiz,
  listCreate,
  clearData,
  questionCreateRes,
  startGame,
  removeQuizV2,
  updateGameState
} from './../test_helper_functions';

let sessionId: string;
let quizId: number;

describe('test delete', () => {
  beforeEach(() => {
    clearData();
    // Creating a new user
    sessionId = (registerUser('exam@example.com', 'shahad124Fawaz', 'Shahad', 'Altowairqi') as
      RegisterSuccessResponse).session;

    // Creating a new quiz
    quizId = (createQuiz(sessionId, 'Math quiz',
      'A description of my quiz') as QuizCreateSuccessResponse).quizId;
  });

  // Test succesfulL cases
  describe('Successful case', () => {
    // Test successful case: remove one quiz
    test('remove one quiz successfully', () => {
      // This test depends on other routes being implemented.

      // Send a DELETE request to remove the quiz
      const res = removeQuiz(sessionId, quizId);

      // Check the list after deletion; it should be empty.
      const quizListRes = listCreate(sessionId);
      const resultList = JSON.parse(quizListRes.body.toString());
      // Expect the quiz list to be completely empty after deletion
      expect(resultList).toStrictEqual({ quizzes: [] });

      expectSuccessEmptyObj(res);
    });

    // Test successful case: remove two quizzes
    test('remove two quizzes successfully', () => {
      // This test depends on other routes being implemented.

      // Create another quiz
      const quizId2 = (createQuiz(sessionId, 'my quiz 2',
        'a description of my quiz') as QuizCreateSuccessResponse).quizId;

      // Send a DELETE request to remove the first quiz
      const res1 = removeQuiz(sessionId, quizId);

      // Should return only the second quiz
      const quizListRes1 = listCreate(sessionId);
      const resultList1 = JSON.parse(quizListRes1.body.toString());

      // Send a DELETE request to remove the second quiz
      const res2 = removeQuiz(sessionId, quizId2);

      // After removing both quizzes , resDelete2 should be an empty list
      const quizListRes2 = listCreate(sessionId);
      const resultList2 = JSON.parse(quizListRes2.body.toString());

      // Expect the quiz list to contain only quiz 2
      expect(resultList1).toStrictEqual({
        quizzes: [
          {
            quizId: quizId2,
            name: 'my quiz 2'
          }
        ]
      });

      // Verify that both quizzes have successfully removed
      expect(resultList2).toStrictEqual({ quizzes: [] });
      expectSuccessEmptyObj(res1);
      expectSuccessEmptyObj(res2);
    });

    test('remove one quiz successfully', () => {
      // This test depends on other routes being implemented.
      questionCreateRes(
        sessionId,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizId, 'http://google.com/some/image/path.jpg');

      const resGame = startGame(sessionId, quizId, 3);
      const gameId = JSON.parse(resGame.body.toString()).gameId;

      updateGameState(sessionId, quizId, gameId, 'END');
      // Send a DELETE request to remove the quiz
      const res = removeQuizV2(sessionId, quizId);

      // Check the list after deletion; it should be empty.
      const quizListRes = listCreate(sessionId);
      const resultList = JSON.parse(quizListRes.body.toString());
      // Expect the quiz list to be completely empty after deletion
      expect(resultList).toStrictEqual({ quizzes: [] });

      expectSuccessEmptyObj(res);
    });
  });

  // Test error cases
  describe('Error cases', () => {
    // Test error case: invalid sessionId
    test('invalid sessionId', () => {
      // Send a DELETE request to remove quiz with invalid sessionId
      const res = removeQuiz(sessionId + 1, quizId);
      expectErrorQuiz(401, res);
    });

    // Test error case: invalid quizId
    test('invalid quizId', () => {
      // Send a DELETE request with an invalid quizId
      const res = removeQuiz(sessionId, quizId + 1);
      expectErrorQuiz(403, res);
    });

    // Test error case: removing removed quiz
    test('removing removed quiz', () => {
      // Send a DELETE request with an invalid quizId
      removeQuiz(sessionId, quizId);
      // Check the list after deletion; it should be empty.
      const quizListRes = listCreate(sessionId);
      const resultList = JSON.parse(quizListRes.body.toString());
      // Expect the quiz list to be completely empty after deletion
      expect(resultList).toStrictEqual({ quizzes: [] });

      // send another request to remove the same quiz
      const res = removeQuiz(sessionId, quizId);

      expectErrorQuiz(403, res);
    });

    // Test case: attempting to remove quiz has active games
    test('removing test when active games exist', () => {
      questionCreateRes(
        sessionId,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizId, 'http://google.com/some/image/path.jpg');

      startGame(sessionId, quizId, 3);

      const res = removeQuizV2(sessionId, quizId);
      expectErrorQuiz(400, res);
    });

    test('invalid sessionId', () => {
      questionCreateRes(
        sessionId,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizId, 'http://google.com/some/image/path.jpg');

      startGame(sessionId, quizId, 3);

      // Send a DELETE request to remove quiz with invalid sessionId
      const res = removeQuizV2(sessionId + 1, quizId);
      expectErrorQuiz(401, res);
    });

    test('invalid quizId', () => {
      questionCreateRes(
        sessionId,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizId, 'http://google.com/some/image/path.jpg');

      startGame(sessionId, quizId, 3);

      // Send a DELETE request with an invalid quizId
      const res = removeQuizV2(sessionId, quizId + 1);
      expectErrorQuiz(403, res);
    });
  });
});
