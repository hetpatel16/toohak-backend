import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../../src_ts/interfaces';
import {
  expectErrorQuiz,
  registerUser,
  createQuiz,
  clearData,
  startGame,
  expectSuccessGameStart,
  questionCreateRes
} from './../../test_helper_functions';

let sessionId: string;
let quizId: number;

describe('test post', () => {
  beforeEach(() => {
    clearData();
    // Creating a new user
    sessionId = (registerUser('exam@example.com', 'shahad124Fawaz', 'Shahad', 'Altowairqi') as
      RegisterSuccessResponse).session;

    // Creating a new quiz
    quizId = (createQuiz(sessionId, 'Math quiz',
      'A description of my quiz') as QuizCreateSuccessResponse).quizId;
  });

  describe('Successful case', () => {
    test('start game successfully', () => {
      // create a new question
      questionCreateRes(sessionId, 'what is 1 + 1?', 20, 3, [{
        answer: 'two',
        correct: false
      }, {
        answer: 'i don\'t know',
        correct: true
      }], quizId, 'http://gooogle.co/sas/.jpg');

      const res = startGame(sessionId, quizId, 3);
      expectSuccessGameStart(res);
    });

    test('gameIds are incremeted', () => {
      // first game
      questionCreateRes(sessionId, 'what is 1 + 1?', 20, 3, [{
        answer: 'ten',
        correct: false
      }, {
        answer: 'three',
        correct: true
      }], quizId, 'http://shahi.co/sas/.jpg');

      const resOne = startGame(sessionId, quizId, 3);

      // second game
      questionCreateRes(sessionId, 'what is 2 + 2?', 10, 2, [{
        answer: 'two',
        correct: false
      }, {
        answer: 'ten',
        correct: true
      }], quizId, 'http://n3na3.co/sas/.jpg');
      const resTwo = startGame(sessionId, quizId, 3);

      // third game
      questionCreateRes(sessionId, 'what is 3 + 3?', 13, 3, [{
        answer: 'thee',
        correct: false
      }, {
        answer: 'ten',
        correct: true
      }], quizId, 'http://aleen.co/sas/.jpg');
      const resThree = startGame(sessionId, quizId, 3);

      // gameIds
      const gameIdOne = JSON.parse(resOne.body.toString()).gameId;
      const gameIdTwo = JSON.parse(resTwo.body.toString()).gameId;
      const gameIdThree = JSON.parse(resThree.body.toString()).gameId;

      expect(gameIdThree).toBeGreaterThan(gameIdTwo);
      expect(gameIdTwo).toBeGreaterThan(gameIdOne);
    });
  });// end describe successful case

  describe('Error cases', () => {
    test('Invalid session, UNAUTHORISED', () => {
      questionCreateRes(sessionId, 'what is 1 + 1?', 20, 3, [{
        answer: 'two',
        correct: false
      }, {
        answer: 'ten',
        correct: true
      }], quizId, 'http://aleen.co/sas/.jpg');
      const res = startGame(sessionId + 1, quizId, 3);

      expectErrorQuiz(401, res);
    }); // invalid session

    test('INVALID_QUIZ_ID', () => {
      questionCreateRes(sessionId, 'what is 1 + 1?', 20, 3, [{
        answer: 'two',
        correct: false
      }, {
        answer: 'ten',
        correct: true
      }], quizId, 'http://aleen.co/sas/.jpg');

      const res = startGame(sessionId, quizId + 1, 3);

      expectErrorQuiz(403, res);
    });// invalid quizId

    test('INVALID_GAME', () => {
      const res = startGame(sessionId, quizId, 51);
      expectErrorQuiz(400, res);
    });// invalid game

    test('MAX_ACTIVATE_GAMES', () => {
      questionCreateRes(sessionId, 'what is 1 + 1?', 20, 3, [{
        answer: 'two',
        correct: false
      }, {
        answer: 'tomomm',
        correct: true
      }], quizId, 'http://link0.co/sas/.jpg');

      // start the first game
      startGame(sessionId, quizId, 3);

      // create another 8 games:
      for (let i = 1; i <= 10; i++) {
        startGame(sessionId, quizId, 5);
      }

      const res = startGame(sessionId, quizId, 5);

      expectErrorQuiz(400, res);
    });

    test('QUIZ_IS_EMPTY', () => {
      const res = startGame(sessionId, quizId, 3);
      expectErrorQuiz(400, res);
    });
  });
});
