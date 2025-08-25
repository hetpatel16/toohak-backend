import {
  expectErrorQuiz,
  registerUser,
  createQuiz,
  questionCreateId,
  updateName,
  updateDescription,
  quizInfo,
  expectedStatusCode,
  clearData
} from './../test_helper_functions';
import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../src_ts/interfaces';

let session: string, quizid: number;

beforeEach(() => {
  clearData();
  const randEmail = Math.random().toString(36).substring(2, 10);
  session = (registerUser(randEmail + '@example.com',
    'strongPassword123', 'Adam', 'Sandler') as RegisterSuccessResponse).session;
});

test('check added quiz', () => {
  quizid = (createQuiz(session, 'history quiz',
    'very hard quiz') as QuizCreateSuccessResponse).quizId;
  const infoRes = quizInfo(session, quizid);
  const res = JSON.parse(infoRes.body as string);
  expectedStatusCode(infoRes, 200);
  expect(res.name).toBe('history quiz');
});

test('check added quiz', () => {
  quizid = (createQuiz(session, 'Physics test',
    'on chapters 2-8') as QuizCreateSuccessResponse).quizId;
  const infoRes = quizInfo(session, quizid);
  const res = JSON.parse(infoRes.body as string);
  expect(res.description).toBe('on chapters 2-8');
  expect(res.name).toBe('Physics test');
});

test('check added quiz after name update', () => {
  quizid = (createQuiz(session, 'Physics test',
    'impossible to pass') as QuizCreateSuccessResponse).quizId;
  updateName(session, 'AP Calculus', quizid);

  const infoRes = quizInfo(session, quizid);
  const res = JSON.parse(infoRes.body as string);
  expect(res.name).toBe('AP Calculus');
  expectedStatusCode(infoRes, 200);
});

test('check added quiz after description update', () => {
  quizid = (createQuiz(session, 'Life',
    'very hard, not everyone can endure') as QuizCreateSuccessResponse).quizId;
  updateDescription(session, quizid, 'may seem hard, but with friends its much better');

  const infoRes = quizInfo(session, quizid);
  const res = JSON.parse(infoRes.body as string);
  expect(res.description).toBe('may seem hard, but with friends its much better');
  expectedStatusCode(infoRes, 200);
});

test('check info return', () => {
  quizid = (createQuiz(session, 'Life in general',
    'very hard, not everyone can endure') as QuizCreateSuccessResponse).quizId;
  questionCreateId(session, 'Am I the goat?', 5, 8,
    [{ answer: 'no', correct: false }, { answer: 'yes', correct: false }],
    quizid, 'https://youAreTheGoat.png');

  const infoRes = quizInfo(session, quizid);
  expectedStatusCode(infoRes, 200);
});

test('no tests - also an invalid quiz id', () => {
  quizid = (createQuiz(session, 'Physics test',
    'on chapters 2-8') as QuizCreateSuccessResponse).quizId;
  const infoRes = quizInfo(session, quizid + 1);
  expectErrorQuiz(403, infoRes);
});

test('quizId does not exist', () => {
  quizid = (createQuiz(session, 'Physics test',
    'on chapters 2-8') as QuizCreateSuccessResponse).quizId;
  const infoRes = quizInfo(session + 1, quizid);
  expectErrorQuiz(401, infoRes);
});
