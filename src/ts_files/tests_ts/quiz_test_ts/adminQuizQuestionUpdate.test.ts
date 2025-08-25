import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../src_ts/interfaces';
import {
  expectSuccessEmptyObj,
  expectErrorQuiz,
  registerUser,
  createQuiz,
  questionCreateId,
  updateQuestion,
  clearData,
  quizInfo
} from './../test_helper_functions';

let session: string, quizid: number;

describe('adminQuizQuestionUpdate', () => {
  beforeEach(() => {
    clearData();
    const randEmail = Math.random().toString(36).substring(2, 10);
    session = (registerUser(randEmail + '@example.com',
      'strongPassword123', 'Adam', 'Sandler') as
        RegisterSuccessResponse).session;
    quizid = (createQuiz(session, 'history quiz',
      'very hard quiz') as QuizCreateSuccessResponse).quizId;
  });

  describe('Successful return cases', () => {
    test('Successful test return', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectSuccessEmptyObj(updateRes);
    });

    test('Side effect case - check updated answeOptions and question', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      updateQuestion(session, 'why is pluto not part of the solar system?', 5, 9, [
        { answer: 'it is too small', correct: true },
        { answer: 'it will soon explode', correct: false }],
      'http://google.com/some/image/path.jpg', quizid, questionId);

      const infoRes = quizInfo(session, quizid);
      const resultObj = JSON.parse(infoRes.body as string);

      expect(resultObj.questions[0].question).toBe('why is pluto not part of the solar system?');
      expect(resultObj.questions[0].answerOptions).toMatchObject([
        { answer: 'it is too small', correct: true },
        { answer: 'it will soon explode', correct: false }]);
    });

    test('Side effect case - check updated points and timeLimit', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      updateQuestion(session, 'why is pluto not part of the solar system?', 5, 9, [
        { answer: 'it is too small', correct: true },
        { answer: 'it will soon explode', correct: false }],
      'http://google.com/some/image/path.jpg',
      quizid, questionId);

      const infoRes = quizInfo(session, quizid);
      const resultObj = JSON.parse(infoRes.body as string);

      expect(resultObj.questions[0].timeLimit).toBe(5);
      expect(resultObj.questions[0].points).toBe(9);
    });

    test('Side effect case - check updated thumbnailUrl', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      updateQuestion(session, 'why is pluto not part of the solar system?', 5, 9, [
        { answer: 'it is too small', correct: true },
        { answer: 'it will soon explode', correct: false }],
      'http://SomeNewWebsiteForEveryBody.jpg', quizid, questionId);

      const infoRes = quizInfo(session, quizid);
      const resultObj = JSON.parse(infoRes.body as string);
      expect(resultObj.questions[0].thumbnailUrl).toBe('http://SomeNewWebsiteForEveryBody.jpg');
    });
  });

  describe('Invalid return', () => {
    test('UNAUTHORIZED - session does not exist', () => {
    // create a quiz question
      const questionId = questionCreateId(session + 1,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session + 1,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(401, updateRes);
    });

    test('INVALID_QUIZ_ID - quizId does not exist', () => {
    // create a quiz question
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid + 1, questionId);

      expectErrorQuiz(403, updateRes);
    });

    test('INVALID_QUESTION_ID - questionId does not exist', () => {
    // create a quiz question
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId + 1);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_QUESTION - less than 5 characters', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session, 'why', 5, 9, [
        { answer: 'it is too small', correct: true },
        { answer: 'it will soon explode', correct: false }],
      'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_QUESTION - points more than 10', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 11, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_ANSWERS - less than 2 answers', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_ANSWERS - duplicate answers', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it is too small', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_ANSWERS - all answers are false', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: false },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_ANSWERS - one answer has a length less than 1', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: '', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_TIMELIMIT - time limit is negative', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', -1, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_TIMELIMIT - sum of all time limits is more than 3 minutes', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        5, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const questionId2 = questionCreateId(session,
        'why do people drink tea',
        171, 3, [{ answer: 'to relax', correct: true },
          { answer: 'to stress', correct: false }], quizid, 'http://google.come/path.jpg').id;

      let updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 50, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);

      updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 50, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path.jpg', quizid, questionId2);
    });

    test('INVALID_THUMBNAIL - thumbnail is empty', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        '', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_THUMBNAIL - does not end with: jpg, jpeg, png', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'http://google.com/some/image/path', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });

    test('INVALID_THUMBNAIL - does not begin with http:// or https://', () => {
      const questionId = questionCreateId(session,
        'how did people guide ships before the gps?',
        4, 2, [{ answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg').id;

      const updateRes = updateQuestion(session,
        'why is pluto not part of the solar system?', 5, 9, [
          { answer: 'it is too small', correct: true },
          { answer: 'it will soon explode', correct: false }],
        'google.com/some/image/path.jpg', quizid, questionId);

      expectErrorQuiz(400, updateRes);
    });
  });
});
