import sleepSync from 'slync';
// import { eagleTimer } from '../../../src_ts/helper_function';
import {
  gameStatusSuccessResponse,
  QuizCreateSuccessResponse,
  QuizInfoSuccessResponse,
  RegisterSuccessResponse
} from '../../../src_ts/interfaces';
import {
  expectErrorQuiz,
  registerUser,
  createQuiz,
  clearData,
  startGame,
  updateGameState,
  expectSuccessEmptyObj,
  gameStatus,
  questionCreateRes,
  expectState
} from './../../test_helper_functions';

let sessionId: string;
let quizId: number;
let gameId: number;
let duration: number;

describe('test put', () => {
  beforeEach(() => {
    clearData();
    // Creating a new user
    sessionId = (registerUser('exam@example.com', 'shahad124Fawaz', 'Shahad', 'Altowairqi') as
      RegisterSuccessResponse).session;

    // Creating a new quiz
    quizId = (createQuiz(sessionId, 'Math quiz',
      'A description of my quiz') as QuizCreateSuccessResponse).quizId;

    // start a new game
    questionCreateRes(
      sessionId,
      'how did people guide ships before the gps?',
      4, 2, [{ answer: 'stars', correct: true },
        { answer: 'intuition', correct: false }],
      quizId, 'http://google.com/some/image/path.jpg');

    gameId = JSON.parse(startGame(sessionId, quizId, 3).body.toString()).gameId;

    const statusBody = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
      gameStatusSuccessResponse);
    const pos = statusBody.atQuestion;
    const metadata = statusBody.metadata as QuizInfoSuccessResponse;
    duration = metadata.questions[pos - 1].timeLimit;
  });

  describe('Successful case', () => {
    describe('LOBBY', () => {
      test('LOBBY to END', () => {
        const res = updateGameState(sessionId, quizId, gameId, 'END');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'END');
      });
      test('LOBBY to QUESTION_COUNTDOWN', () => {
        const res = updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'QUESTION_COUNTDOWN');
      });
    });
    describe('QUESTION_COUNTDOWN', () => {
      test('QUESTION_COUNTDOWN to END', () => {
        // update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');

        // update to END
        const res = updateGameState(sessionId, quizId, gameId, 'END');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'END');
      });
      test('QUESTION_COUNTDOWN to QUESTION_OPEN - countdown skipped', () => {
        // Update to QUESITON_COUDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESITON_OPEN
        const res = updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'QUESTION_OPEN');
      });
      test('QUESTION_COUNTDOWN to QUESTION_OPEN - wait 3 seconds', () => {
        // Update to QUESTION_COUNTDOWN
        const res = updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        expectSuccessEmptyObj(res);
        // Check state before the delay - expect QUESTION_COUTNDOWN
        const stateBefore = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(stateBefore, 'QUESTION_COUNTDOWN');

        // delay three secondes
        sleepSync(3 * 1000);

        // Check state after delay - expect QUESTION_OPEN
        const stateِAfter = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expect(stateِAfter).toStrictEqual('QUESTION_OPEN');
      });
    });
    describe('QUESTION_OPEN', () => {
      test('QUESTION_OPEN to END', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');

        // Update to END
        const res = updateGameState(sessionId, quizId, gameId, 'END');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'END');
      });
      test('QUESTION_OPEN to ANSWER_SHOW', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        // Update to ANSWER_SHOW
        const res = updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
                        gameStatusSuccessResponse).state;
        expect(state).toStrictEqual('ANSWER_SHOW');
      });
      test('QUESTION_OPEN to QUESTION_CLOSE - count down skipped', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        const res = updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        expectSuccessEmptyObj(res);

        // Check state before the delay - expect QUESTION_OPEN
        const stateBefore = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expect(stateBefore).toStrictEqual('QUESTION_OPEN');

        sleepSync(duration * 1000);

        // Check state after delay - expect QUESTION_CLOSE
        const stateِAfter = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expect(stateِAfter).toStrictEqual('QUESTION_CLOSE');
      });
      test('QUESTION_OPEN to QUESTION_CLOSE - no countdown is skipped', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Check state before the delay - expect QUESTION_COUTNDOWN
        const stateBefore = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(stateBefore, 'QUESTION_COUNTDOWN');

        // delay three secondes
        sleepSync(3 * 1000);

        // Check state after delay - expect QUESTION_OPEN
        let stateِAfter = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(stateِAfter, 'QUESTION_OPEN');

        sleepSync(duration * 1000);

        // Check state after delay - expect QUESTION_CLOSE
        stateِAfter = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(stateِAfter, 'QUESTION_CLOSE');
      });
    });
    describe('QUESTION_CLOSE', () => {
      test('QUESTION_CLOSE to END', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        // Update to QUESTION_CLOSE
        sleepSync(duration * 1000);

        // Update to END
        const res = updateGameState(sessionId, quizId, gameId, 'END');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'END');
      });
      test('QUESTION_CLOSE to ANSWER_SHOW', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        // Update to QUESTION_CLOSE
        sleepSync(duration * 1000);

        // Update to ANSWER_SHOW
        const res = updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'ANSWER_SHOW');
      });
      test('QUESTION_CLOSE to QUESTION_COUNTDOWN', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        // Update to QUESTION_CLOSE
        sleepSync(duration * 1000);

        const res = updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        expectSuccessEmptyObj(res);
        // check status from status
        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'QUESTION_COUNTDOWN');
      });

      test('QUESTION_CLOSE to FINAL_RESULTS', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        // Update to QUESTION_CLOSE
        sleepSync(duration * 1000);

        // Update to FINAL_RESULTS
        const res = updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS');
        expectSuccessEmptyObj(res);
        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'FINAL_RESULTS');
      });
      test('test updateNextQuestion', () => {
        // create another question
        questionCreateRes(
          sessionId,
          'where is the moon',
          4, 2, [{ answer: 'sky', correct: true },
            { answer: 'sea', correct: false }],
          quizId, 'http://google.com/some/image/path.jpg');

        const gameId2 = JSON.parse(startGame(sessionId, quizId, 3).body.toString()).gameId;

        // Update to QUESTION_COUNTDOWN - question one
        updateGameState(sessionId, quizId, gameId2, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN - question one
        updateGameState(sessionId, quizId, gameId2, 'SKIP_COUNTDOWN');
        // Update to QUESTION_CLOSE - question one
        sleepSync(duration * 1000);

        // check if last question
        // Update to QUESTION_COUNTDOWN - question two
        updateGameState(sessionId, quizId, gameId2, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN - question two
        updateGameState(sessionId, quizId, gameId2, 'SKIP_COUNTDOWN');
        // Update to QUESTION_CLOSE - question two
        sleepSync(duration * 1000);

        // Update to FINAL_RESULTS
        const res = updateGameState(sessionId, quizId, gameId2, 'GO_TO_FINAL_RESULTS');
        expectSuccessEmptyObj(res);
        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId2).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'FINAL_RESULTS');
      });
    });
    describe('FINAL_RESULTS', () => {
      test('FINAL_RESULTS to END', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        // Update to QUESTION_CLOSE
        sleepSync(duration * 1000);

        // Update FINAL_RESULTS
        updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS');

        // Update to END
        const res = updateGameState(sessionId, quizId, gameId, 'END');
        expectSuccessEmptyObj(res);

        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'END');
      });
    });
    describe('ANSWER_SHOW', () => {
      test('ANSWER_SHOW to END', () => {
        // Update to QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        // Update to QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        // Update to QUESTION_CLOSE
        sleepSync(duration * 1000);

        // Update to ANSWER_SHOW
        updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER');
        const res = updateGameState(sessionId, quizId, gameId, 'END');
        expectSuccessEmptyObj(res);
        // check status from status
        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'END');
      });
      test('ANSWER_SHOW to QUESTION_COUNTDOWN', () => {
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        sleepSync(duration * 1000);
        updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER');
        const res = updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        expectSuccessEmptyObj(res);
        // check status from status
        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expect(state).toStrictEqual('QUESTION_COUNTDOWN');
      });
      test('ANSWER_SHOW to FINAL_RESULTS', () => {
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        sleepSync(duration * 1000);
        updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER');
        const res = updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS');
        expectSuccessEmptyObj(res);
        // check status from status
        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'FINAL_RESULTS');
      });
    });
    describe('FINAL_RESULTS', () => {
      test('FINAL_RESULTS to END', () => {
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        sleepSync(duration * 1000);
        updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS');
        const res = updateGameState(sessionId, quizId, gameId, 'END');
        expectSuccessEmptyObj(res);
        // check status from status
        // side effect
        const state = (JSON.parse(gameStatus(sessionId, quizId, gameId).body.toString()) as
          gameStatusSuccessResponse).state;
        expectState(state, 'END');
      });
    });
  });// end describe successful case

  describe('Error cases', () => {
    test('Invalid session, UNAUTHORISED', () => {
      const res = updateGameState(sessionId + 1, quizId, gameId, 'NEXT_QUESTION');
      expectErrorQuiz(401, res);
    }); // invalid session

    test('INVALID_QUIZ_ID', () => {
      const res = updateGameState(sessionId, quizId + 1, gameId, 'NEXT_QUESTION');
      expectErrorQuiz(403, res);
    });// invalid quizId

    test('INVALID_GAME_ID', () => {
      const res = updateGameState(sessionId, quizId, gameId + 1, 'NEXT_QUESTION');
      expectErrorQuiz(400, res);
    });// invalid game

    describe('INVALID_ACTION', () => {
      test('INVALID_ACTION - LOBBY to QUESTION_COUTNDOWN', () => {
        const res = updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        expectErrorQuiz(400, res);
      });
      test('INVALID_ACTION - QUESTION_COUNTDOWN to QUESTION_OPEN', () => {
        // at QUESTION_COUNTDOWN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');

        const res = updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        expectErrorQuiz(400, res);
      });
      test('INVALID_ACTION - QUESTION_OPEN to ANSWER_SHOW', () => {
        // at QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');

        const res = updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS');
        expectErrorQuiz(400, res);
      });
      test('INVALID_ACTION - ANSWER_SHOW to FINAL_RESULT', () => {
        // at QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        sleepSync(duration * 1000);

        updateGameState(sessionId, quizId, gameId, 'GO_TO_ANSWER');
        const res = updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        expectErrorQuiz(400, res);
      });
      test('INVALID_ACTION - QUESTION_CLOSE to FINAL_RESULT', () => {
        // at QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        sleepSync(duration * 1000);

        const res = updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        expectErrorQuiz(400, res);
      });
      test('INVALID_ACTION - FINAL_RESULT to END', () => {
        // at QUESTION_OPEN
        updateGameState(sessionId, quizId, gameId, 'NEXT_QUESTION');
        updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        sleepSync(duration * 1000);
        updateGameState(sessionId, quizId, gameId, 'GO_TO_FINAL_RESULTS');
        const res = updateGameState(sessionId, quizId, gameId, 'SKIP_COUNTDOWN');
        expectErrorQuiz(400, res);
      });
    });

    test('INCOMPATIBLE_GAME_STATE', () => {
      const res = updateGameState(sessionId, quizId, gameId, 'END_THIS_GAME');
      expectErrorQuiz(400, res);
    });
  });
});
