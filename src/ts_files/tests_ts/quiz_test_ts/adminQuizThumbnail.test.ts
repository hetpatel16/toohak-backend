import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../src_ts/interfaces';
import {
  expectSuccessEmptyObj,
  expectErrorQuiz,
  registerUser,
  createQuiz,
  updateThumbnail,
  quizInfo,
  clearData
} from './../test_helper_functions';
let sessionId: string;
let quizId: number;

describe('test PUT', () => {
  beforeEach(() => {
    clearData();

    const randEmail = Math.random().toString(36).substring(2, 10);
    // Creating a new user
    sessionId = (registerUser(randEmail + '@example.com', 'yuchaojiang123',
      'Yuchao', 'Jiang') as RegisterSuccessResponse).session;

    // Creating a new quiz
    quizId = (createQuiz(sessionId, 'My quiz',
      'A description of my quiz') as QuizCreateSuccessResponse).quizId;
  });

  // Test successful cases
  describe('Successful case', () => {
    // Test successful case: update question thumbnail
    test('update question thumbnail successfully', () => {
      const res = updateThumbnail(sessionId, quizId, 'http://gooogle.co/sas/.jpg');

      // Send a GET request to view the info of the quiz
      const quizInfoRes = quizInfo(sessionId, quizId);

      const resultThumbnail = JSON.parse(quizInfoRes.body.toString()).thumbnailUrl;
      const resultTimeLastEdited = JSON.parse(quizInfoRes.body.toString()).timeLastEdited;

      expect(resultThumbnail).toStrictEqual('http://gooogle.co/sas/.jpg');
      expect(resultTimeLastEdited).toStrictEqual(Math.floor(Date.now() / 1000));

      expectSuccessEmptyObj(res);
    });

    // Test successful case: test that the thumbnail of two quizzes can be updated successfully
    test('update thumbnail for two quizzes successfully', () => {
      // Create another quiz for testing multiple quiz updates
      const quizId2 = (createQuiz(sessionId, 'My Quiz Name 2',
        'A description of my quiz') as QuizCreateSuccessResponse).quizId;

      // Send the first PUT request to update quiz 1 thumbnail
      const res1 = updateThumbnail(sessionId, quizId, 'http://google.c/sa/.jpg');
      // Should return the quiz 1 with the updated thumbnail
      const quizInfoRes1 = quizInfo(sessionId, quizId);

      // Send the second PUT request to update quiz 2 thumbnail
      const res2 = updateThumbnail(sessionId, quizId2, 'http://google.com/s/.jpg');
      const quizInfoRes2 = quizInfo(sessionId, quizId2);

      const resultThumbnail1 = JSON.parse(quizInfoRes1.body.toString()).thumbnailUrl;
      expect(resultThumbnail1).toStrictEqual('http://google.c/sa/.jpg');

      const resultThumbnail2 = JSON.parse(quizInfoRes2.body.toString()).thumbnailUrl;
      expect(resultThumbnail2).toStrictEqual('http://google.com/s/.jpg');

      expectSuccessEmptyObj(res1);
      expectSuccessEmptyObj(res2);
    });
  });

  // Test error cases
  describe('Error cases', () => {
    // Test error case : invalid sessionId
    test('invalid sessionId', () => {
      const res = updateThumbnail(sessionId + 1, quizId, 'http://gooogle.co/sas/.jpg');
      expectErrorQuiz(401, res);
    });

    // Test error case : invalid quizId
    test('invalid quizId', () => {
      const res = updateThumbnail(sessionId, quizId + 1, 'http://gooogle.co/sas/.jpg');
      expectErrorQuiz(403, res);
    });

    test.each([
      ['ssf://someweb.com/image.jpg'],
      ['htrr://someweb.com/image.jpeg'],
      ['//someweb.com/image.jpg'],
      ['http://someweb.com/image.sdg'],
      ['http://someweb.com/image.pgg'],
      ['https://someweb.com/image.jpq'],
      ['https://someweb.com/image.dsh'],
      ['http://someweb.com/image'],
    ])('thumbnailUrl %s is invalid', (thumbnail) => {
      const res = updateThumbnail(sessionId, quizId, thumbnail);
      expectErrorQuiz(400, res);
    });
  });
});
