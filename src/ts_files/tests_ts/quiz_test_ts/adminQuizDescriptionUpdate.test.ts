import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../src_ts/interfaces';
import {
  expectSuccessEmptyObj,
  expectErrorQuiz,
  registerUser,
  createQuiz,
  updateDescription,
  quizInfo,
  clearData
} from './../test_helper_functions';
let sessionId: string;
let quizId: number;

describe('test put', () => {
  beforeEach(() => {
    clearData();
    // Creating a new user
    sessionId = (registerUser('yoch@example.com', 'yuchaojiang123', 'Yuchao', 'Jiang') as
        RegisterSuccessResponse).session;
    // Creating a new quiz
    quizId = (
      createQuiz(sessionId, 'My quiz', 'A description of my quiz') as QuizCreateSuccessResponse
    ).quizId;
  });

  // Test succesfull cases
  describe('Successful case', () => {
    // Test updating the description and verify the is successful
    test('update quiz description successfully', () => {
      // Send a PUT request to update the quiz description
      const res = updateDescription(sessionId, quizId, 'new description');

      // Send a GET request to view quiz info, including the updated description
      const quizInfoRes = quizInfo(sessionId, quizId);
      // Parse the response and check that the description matches the updated value
      const resultinfo = JSON.parse(quizInfoRes.body.toString()).description;
      expect(resultinfo).toStrictEqual('new description');

      // Confirm the response is an empty object after a successful update
      expectSuccessEmptyObj(res);
    });

    // Test that submitting an empty description is successful and returns status 200
    test('empty description', () => {
      // Send a PUT request to update the quiz description
      const res = updateDescription(sessionId, quizId, '');

      // Send a GET request to view quiz info, including the updated description
      const quizInfoRes = quizInfo(sessionId, quizId);

      // Parse the response and check that the description matches the updated value
      const resultinfo = JSON.parse(quizInfoRes.body.toString()).description;
      expect(resultinfo).toStrictEqual('');

      // Confirm the response is an empty object after a successful update
      expectSuccessEmptyObj(res);
    });

    // Test that updating the description for two quizzes succeeds
    test('update description for two quiz successfully', () => {
      // Create another quiz for testing multiple quiz updates
      const quiz2 = createQuiz(sessionId, 'My Quiz Name 2', 'A description of my quiz');
      const quizId2 = (quiz2 as QuizCreateSuccessResponse).quizId;
      // Send a PUT request to update the quiz description
      const res1 = updateDescription(sessionId, quizId, 'new description');

      // Should return quiz 1 info with updated description
      const quizInfoRes1 = quizInfo(sessionId, quizId);

      // Update quiz2 description
      const res2 = updateDescription(sessionId, quizId2, 'new description');

      // Should return quiz 2 info with updated description
      const quizInfoRes2 = quizInfo(sessionId, quizId2);

      // Check that quiz 1 description is correctly updated
      const resultInfo1 = JSON.parse(quizInfoRes1.body.toString()).description;
      expect(resultInfo1).toStrictEqual('new description');

      // Check that quiz 2 description is correctly updated
      const resultInfo2 = JSON.parse(quizInfoRes2.body.toString()).description;
      expect(resultInfo2).toStrictEqual('new description');

      expectSuccessEmptyObj(res1);
      expectSuccessEmptyObj(res2);
    });
  });

  // Test error cases
  describe('Error cases', () => {
    // Test error case: invalid sessionId
    test('invalid sessionId', () => {
      // Send a PUT request with an invalid sessionId
      const res = updateDescription(sessionId + 1, quizId, 'new description');
      expectErrorQuiz(401, res);
    });

    // Test error case: invalid quizId
    test('invalid quizId', () => {
      // Send a PUT request with an invalid quizId
      const res = updateDescription(sessionId, quizId + 1, 'new description');
      expectErrorQuiz(403, res);
    });

    // Test error case: description lenght exceeds the valid limit
    test('description > 100 character', () => {
      // Send a PUT request with a description that exceeds the maximum allowed length
      const res = updateDescription(sessionId, quizId, 's'.repeat(103));
      expectErrorQuiz(400, res);
    });
  });
});
