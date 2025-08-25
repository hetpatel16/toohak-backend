import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../src_ts/interfaces';
import {
  expectErrorQuiz,
  registerUser,
  createQuiz,
  questionCreateRes,
  clearData,
  expectedStatusCode
} from './../test_helper_functions';

let session: string, quizid: number;

beforeEach(() => {
  clearData();
  const randEmail = Math.random().toString(36).substring(2, 10);
  session = (registerUser(randEmail + '@example.com',
    'strongPassword123', 'Adam', 'Sandler') as
        RegisterSuccessResponse).session;
  quizid = (createQuiz(session, 'history quiz',
    'very hard quiz')as QuizCreateSuccessResponse).quizId;
});

describe('adminQuizQuestionCreate', () => {
  describe('Succseful return cases', () => {
    test('Successful test return', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 2, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg');

      const res = JSON.parse(questionRes.body as string);

      expectedStatusCode(questionRes, 200);
      expect(res).toMatchObject({ questionId: expect.any(Number) });
    });

    test('Successful test return', () => {
      const questionRes = questionCreateRes(session,
        'what is 1 + 1?', 6, 7, [
          { answer: '2', correct: true },
          { answer: '0', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg');

      const res = JSON.parse(questionRes.body as string);

      expect(questionRes.statusCode).toStrictEqual(200);
      expect(res).toMatchObject({ questionId: expect.any(Number) });
    });
  });

  describe('Invalid return', () => {
    test('UNAUTHORIZED - session does not exist', () => {
      const questionRes = questionCreateRes(session + 1,
        'how did people guide ships before the gps?', 4, 2, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg');
      expectErrorQuiz(401, questionRes);
    });

    test('INVALID_QUIZ_ID - quizId does not exist', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 2, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid + 1, 'http://google.com/some/image/path.jpg');
      expectErrorQuiz(403, questionRes);
    });

    test('INVALID_QUESTION - less than 5 characters', () => {
      const questionRes = questionCreateRes(session, 'how', 4, 2, [
        { answer: 'stars', correct: true },
        { answer: 'intuition', correct: false }], quizid, 'http://google.com/some/image/path.jpg');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_QUESTION - points more than 10', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 50, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg');
      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_ANSWERS - less than 2 answers', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 5,
        [{ answer: 'stars', correct: true }], quizid, 'http://google.com/some/image/path.jpg');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_ANSWERS - duplicate answers', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 5, [
          { answer: 'stars', correct: true },
          { answer: 'stars', correct: false }], quizid, 'http://google.com/some/image/path.jpg');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_ANSWERS - all answers are false', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 5, [
          { answer: 'stars', correct: false },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_ANSWERS - one answer has a length less than 1', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 5, [
          { answer: 'stars', correct: true },
          { answer: '', correct: false }], quizid, 'http://google.com/some/image/path.jpg');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_TIMELIMIT - time limit is negative', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', -1, 5, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_TIMELIMIT - time limit bigger than 180', () => {
      questionCreateRes(session,
        'how did people guide ships before the gps?', 5, 5, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg');

      const questionRes = questionCreateRes(session,
        'What is 2 + 2?', 190, 10, [
          { answer: '4', correct: true },
          { answer: '5', correct: false }],
        quizid, 'http://google.com/some/image/path.jpg');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_THUMBNAIL - thumbnail is empty', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 5, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }], quizid, '');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_THUMBNAIL - does not end with: jpg, jpeg, png', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 5, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }], quizid,
        'http://google.com/some/image/path.com');

      expectErrorQuiz(400, questionRes);
    });

    test('INVALID_THUMBNAIL - does not begin with http:// or https://', () => {
      const questionRes = questionCreateRes(session,
        'how did people guide ships before the gps?', 4, 5, [
          { answer: 'stars', correct: true },
          { answer: 'intuition', correct: false }], quizid, 'google.com/some/image/path.jpg');

      expectErrorQuiz(400, questionRes);
    });
  });
});
