import {
  expectErrorQuiz,
  registerUser,
  createQuiz,
  listCreate,
  clearData,
  expectedStatusCode,
} from './../test_helper_functions';
import { RegisterSuccessResponse } from '../../src_ts/interfaces';

let session: string;

beforeEach(() => {
  clearData();
  const randEmail = Math.random().toString(36).substring(2, 10);
  session = (registerUser(randEmail + '@example.com',
    'strongPassword123', 'Adam', 'Sandler') as
        RegisterSuccessResponse).session;
});

test('return list of 3 quizzes', () => {
  createQuiz(session, 'history quiz', 'very hard quiz');
  createQuiz(session, 'physics quiz', 'on chapters 2-3');
  createQuiz(session, 'English quiz', 'on chapters 5-6');
  createQuiz(session, 'math quiz', 'on all the book');

  const listRes = listCreate(session);

  const result = JSON.parse(listRes.body.toString());

  expectedStatusCode(listRes, 200);
  expect(result.quizzes.length).toBe(4);
});

test('return list of 1 quiz', () => {
  createQuiz(session, 'History quiz', 'Possibly the hardest');
  const listRes = listCreate(session);

  const result = JSON.parse(listRes.body.toString());

  expectedStatusCode(listRes, 200);
  expect(result.quizzes[0].name).toBe('History quiz');
});

test('return list of 8 quizzes', () => {
  createQuiz(session, 'physics quiz', 'on chapters 2-3');
  createQuiz(session, 'English quiz', 'on chapters 5-6');
  createQuiz(session, 'math quiz', 'on all the book');
  createQuiz(session, 'history quiz', 'on half the book');
  createQuiz(session, 'art quiz', 'on all artwork');
  createQuiz(session, 'science quiz', 'on plants');
  createQuiz(session, 'PE quiz', 'on table tennis');
  createQuiz(session, 'SAT quiz', 'Quiz is at the centre');

  const listRes = listCreate(session);
  const result = JSON.parse(listRes.body.toString());

  expectedStatusCode(listRes, 200);
  expect(result.quizzes.length).toBe(8);
});

test('return empty list - no quiz created', () => {
  const listRes = listCreate(session);
  const result = JSON.parse(listRes.body.toString());
  expectedStatusCode(listRes, 200);
  expect(result.quizzes).toEqual([]);
});

test('userId does not exist', () => {
  const listRes = listCreate(session + 1);
  expectErrorQuiz(401, listRes);
});
