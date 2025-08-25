import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../src_ts/interfaces';
import {
  expectSuccessEmptyObj,
  expectErrorQuiz,
  registerUser,
  createQuiz,
  updateName,
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
    quizId = (createQuiz(sessionId, 'Comp Sci Quiz',
      'A description of my quiz') as QuizCreateSuccessResponse).quizId;
  });

  // Test successful cases
  describe('Successful case', () => {
    // Test successful case: update quiz name
    test('update quiz name successfully', () => {
      // Send a PUT request to update the quiz name
      const res = updateName(sessionId, 'new name', quizId);
      expectSuccessEmptyObj(res);

      // Send a GET request to view the quiz information
      const quizInfoRes = quizInfo(sessionId, quizId);
      const updatedName = JSON.parse(quizInfoRes.body.toString()).name;
      expect(updatedName).toStrictEqual('new name');
    });

    // Test successful case: test that the names of tow quizzes can be updated successfully
    test('update naming for two quizzes successfully', () => {
      // Create another quiz for testing multiple quiz updates
      const quizId2 = (createQuiz(sessionId, 'My quiz 2',
        'A description of my quiz') as QuizCreateSuccessResponse).quizId;

      // Send the second PUT request to update quiz 2 name
      const res2 = updateName(sessionId, 'new name 2', quizId2);

      // List quiz 2 information after updating name
      const info2 = quizInfo(sessionId, quizId2);
      const updatedName2 = JSON.parse(info2.body.toString()).name;
      expect(updatedName2).toStrictEqual('new name 2');

      // Send the first PUT request to update quiz 1 name
      const res1 = updateName(sessionId, 'new name', quizId);

      // Should quiz 1 info with the updated name
      const info1 = quizInfo(sessionId, quizId);
      const updatedName1 = JSON.parse(info1.body.toString()).name;
      expect(updatedName1).toStrictEqual('new name');

      expectSuccessEmptyObj(res1);
      expectSuccessEmptyObj(res2);
    });
  });

  // Test error cases
  describe('Error cases', () => {
    // Test error case : invalid sessionId
    test('invalid sessionId', () => {
      // send a PUT request to update the quiz name
      const res = updateName(sessionId + 1, 'new name', quizId);
      expectErrorQuiz(401, res);
    });

    // Test error case : invalid quizId
    test('invalid quizId', () => {
      // send a PUT request to update the quiz name
      const res = updateName(sessionId, 'new name', quizId + 1);
      expectErrorQuiz(403, res);
    });

    // Test error case : name contains special characters
    test.each([
      ['n#@$am'],
      ['naame@#% 234'],
      ['math_quiz_'],
      ['math_quiz_1'],
      ['comp_quiz@year_1']
    ])('invalid characters: %s', (name:string) => {
      // send a PUT request to update the quiz name
      const res = updateName(sessionId, name, quizId);
      expectErrorQuiz(400, res);
    });

    // Test error case : name length < 3 or > 30
    test.each([
      ['n'],
      ['nm'],
      ['s'.repeat(32)]
    ])('%s', (name) => {
      // send a PUT request to update the quiz name
      const res = updateName(sessionId, name, quizId);
      expectErrorQuiz(400, res);
    });

    // Test error case : new quiz name already exists
    test('duplicated name', () => {
      // Creating new quiz
      const quizId2 = (createQuiz(sessionId, 'My quiz 2',
        'A description of my quiz') as QuizCreateSuccessResponse).quizId;

      // send a PUT request to update the quiz name
      const res = updateName(sessionId, 'Comp Sci Quiz', quizId2);
      expectErrorQuiz(400, res);
    });
  });
});
