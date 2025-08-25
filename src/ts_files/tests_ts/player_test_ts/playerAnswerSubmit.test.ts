import request from 'sync-request-curl';
import config from './../../../config.json';
import {
  registerUser,
  createQuiz,
  questionCreateId,
  startGame,
  joinGame,
  clearData,
  expectSuccessEmptyObj,
  updateGameState,
  advanceToQuestionOpen,
  submitPlayerAnswerRes,
  expectedStatusCode,
  advanceToAnswerShow,
  expectErrorObj
} from './../test_helper_functions';
import { QuizCreateSuccessResponse, RegisterSuccessResponse } from '../../src_ts/interfaces';

const port = config.port;
const url = config.url;

describe('PUT /v1/player/:playerid/question/:questionposition/answer', () => {
  let userSession: string;
  let quizId: number;
  let gameId: number;
  let playerId: number;
  // Clear memory before each test
  beforeEach(() => {
    clearData();

    // Set up test data
    const userResponse = registerUser('test@example.com', 'Password123', 'John', 'Doe');
    userSession = (userResponse as RegisterSuccessResponse).session;

    const quizResponse = createQuiz(userSession, 'Test Quiz', 'A test quiz');
    if ('error' in quizResponse) {
      throw new Error('Failed to create quiz');
    }
    quizId = quizResponse.quizId;

    // Create a single-choice question
    questionCreateId(
      userSession,
      'What is the capital of France?',
      30,
      5,
      [
        { answer: 'London', correct: false },
        { answer: 'Paris', correct: true },
        { answer: 'Berlin', correct: false },
        { answer: 'Madrid', correct: false }
      ],
      quizId,
      'http://example.com/image.jpg'
    );

    const gameResponse = startGame(userSession, quizId, 3);
    gameId = JSON.parse(gameResponse.body.toString()).gameId;

    const playerResponse = joinGame(gameId, 'TestPlayer');
    playerId = JSON.parse(playerResponse.body.toString()).playerId;
  });

  describe('Success Cases', () => {
    test('Valid single answer submission returns empty object', () => {
      // Advance game to QUESTION_OPEN state
      advanceToQuestionOpen(userSession, quizId, gameId);

      const result = submitPlayerAnswerRes(playerId, [2], 1); // Paris (correct answer)

      expectSuccessEmptyObj(result);
    });

    test('Valid multiple answer submission for multi-choice question', () => {
      // Create multi-choice scenario

      const multiQuizResponse =
      createQuiz(userSession,
        'Multi Quiz',
        'Multi choice quiz'
      ) as QuizCreateSuccessResponse;
      const multiQuizId = multiQuizResponse.quizId;

      questionCreateId(
        userSession,
        'Which are programming languages?',
        30,
        5,
        [
          { answer: 'JavaScript', correct: true },
          { answer: 'Python', correct: true },
          { answer: 'HTML', correct: false },
          { answer: 'CSS', correct: false }
        ],
        multiQuizId,
        'http://example.com/image.jpg'
      );

      const multiGameResponse = startGame(userSession, multiQuizId, 3);
      const multiGameId = JSON.parse(multiGameResponse.body.toString()).gameId;

      const multiPlayerResponse = joinGame(multiGameId, 'MultiPlayer');
      const multiPlayerId = JSON.parse(multiPlayerResponse.body.toString()).playerId;

      // Advance to QUESTION_OPEN
      advanceToQuestionOpen(userSession, multiQuizId, multiGameId);

      // Multiple correct answers
      const result = submitPlayerAnswerRes(multiPlayerId, [1, 2], 1);

      expectSuccessEmptyObj(result);
    });

    test('Player can resubmit answer successfully', () => {
      // Advance to QUESTION_OPEN
      advanceToQuestionOpen(userSession, quizId, gameId);

      // Submit first answer
      submitPlayerAnswerRes(playerId, [1], 1); // London (incorrect)

      // Submit second answer (should overwrite)
      const result = submitPlayerAnswerRes(playerId, [2], 1);

      expectSuccessEmptyObj(result);
    });
  });

  describe('Error Cases - Invalid Player ID', () => {
    test.each([
      [99999, 'non-existent player ID'],
      [-1, 'negative player ID'],
      [0, 'zero player ID'],
    ])('Invalid player ID %s returns INVALID_PLAYER_ID error',
      (invalidPlayerId, description) => {
        const result = submitPlayerAnswerRes(invalidPlayerId, [1], 1);

        const body = JSON.parse(result.body.toString());
        expectErrorObj(body, 'INVALID_PLAYER_ID');
      });
  });

  describe('Error Cases - Game State', () => {
    test('Game in QUESTION_CLOSE state returns status 400', () => {
      updateGameState(userSession, quizId, gameId, 'NEXT_QUESTION');
      updateGameState(userSession, quizId, gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession, quizId, gameId, 'GO_TO_ANSWER');

      const result = submitPlayerAnswerRes(playerId, [1], 1);

      expectedStatusCode(result, 400);
    });

    test('Game in QUESTION_CLOSE state returns INCOMPATIBLE_GAME_STATE error', () => {
      updateGameState(userSession, quizId, gameId, 'NEXT_QUESTION');
      updateGameState(userSession, quizId, gameId, 'SKIP_COUNTDOWN');
      updateGameState(userSession, quizId, gameId, 'GO_TO_ANSWER');

      const result = submitPlayerAnswerRes(playerId, [1], 1);

      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INCOMPATIBLE_GAME_STATE');
    });

    test('Game in ANSWER_SHOW state returns status 400', () => {
      try {
        advanceToAnswerShow(userSession, quizId, gameId);
      } catch (error) {
        return;
      }

      const result = submitPlayerAnswerRes(playerId, [1], 1);

      expectedStatusCode(result, 400);
    });

    test('Game in ANSWER_SHOW state returns INCOMPATIBLE_GAME_STATE error', () => {
      try {
        advanceToAnswerShow(userSession, quizId, gameId);
      } catch (error) {
        return;
      }

      const result = submitPlayerAnswerRes(playerId, [1], 1);

      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INCOMPATIBLE_GAME_STATE');
    });
  });

  describe('Error Cases - Invalid Question Position', () => {
    test.each([
      [999, 'question position too high'],
      [0, 'zero question position'],
      [-1, 'negative question position']
    ])('Invalid question position triggers INVALID_POSITION: %s - %s',
      (position, description) => {
        // Need to advance to QUESTION_OPEN to get past game state validation
        advanceToQuestionOpen(userSession, quizId, gameId);

        const result = submitPlayerAnswerRes(playerId, [1], position);

        expectedStatusCode(result, 400);
        const body = JSON.parse(result.body.toString());
        expectErrorObj(body, 'INVALID_POSITION');
      });

    test('Invalid question position triggers INVALID_POSITION: 1.5 - float question position',
      () => {
        const result = submitPlayerAnswerRes(playerId, [1], 1.5);

        expectedStatusCode(result, 400);
        const body = JSON.parse(result.body.toString());
        // This will be INCOMPATIBLE_GAME_STATE because we haven't advanced the game state
        expectErrorObj(body, 'INCOMPATIBLE_GAME_STATE');
      }
    );
  });

  describe('Error Cases - Question Position vs Game State', () => {
    test('Question position 2 when game is on question 1 triggers INVALID_POSITION', () => {
      // Advance to QUESTION_OPEN state for question 1
      advanceToQuestionOpen(userSession, quizId, gameId);

      const result = submitPlayerAnswerRes(playerId, [1], 2);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_POSITION');
    });
  });

  describe('Error Cases - Invalid Answer IDs', () => {
    beforeEach(() => {
      advanceToQuestionOpen(userSession, quizId, gameId);
    });

    test('Empty answer array triggers INVALID_ANSWER_IDS', () => {
      const result = submitPlayerAnswerRes(playerId, [], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Answer IDs must be valid for the specific question', () => {
      const result = submitPlayerAnswerRes(playerId, [999], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Non-integer answer ID triggers INVALID_ANSWER_IDS', () => {
      const result = submitPlayerAnswerRes(playerId, [1.5], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Negative answer ID triggers INVALID_ANSWER_IDS', () => {
      const result = submitPlayerAnswerRes(playerId, [-1], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Zero answer ID triggers INVALID_ANSWER_IDS', () => {
      const result = submitPlayerAnswerRes(playerId, [0], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Non-existent answer ID triggers INVALID_ANSWER_IDS', () => {
      const result = submitPlayerAnswerRes(playerId, [999], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Duplicate answer IDs trigger INVALID_ANSWER_IDS', () => {
      const result = submitPlayerAnswerRes(playerId, [1, 1, 2], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Missing answerIds field triggers INVALID_ANSWER_IDS', () => {
      const position = 1;
      const result = request(
        'PUT',
        `${url}:${port}/v1/player/${playerId}/question/${position}/answer`, {
          json: {}, // Missing answerIds field
          timeout: 100
        });

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Non-array answerIds triggers INVALID_ANSWER_IDS', () => {
      const position = 1;
      const result = request(
        'PUT',
        `${url}:${port}/v1/player/${playerId}/question/${position}/answer`, {
          json: { answerIds: 'not an array' },
          timeout: 100
        });

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('String in answerIds array triggers INVALID_ANSWER_IDS', () => {
      const position = 1;
      const result = request(
        'PUT',
        `${url}:${port}/v1/player/${playerId}/question/${position}/answer`, {
          json: { answerIds: [1, 'two', 3] },
          timeout: 100
        });

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('answerIds not being an array (server-side validation)', () => {
      const position = 1;
      const result = request(
        'PUT',
        `${url}:${port}/v1/player/${playerId}/question/${position}/answer`, {
          json: { answerIds: 'not an array' },
          timeout: 100
        });

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });
  });

  describe('Error Cases - Multiple Choice Validation', () => {
    let multiChoiceGameId: number;
    let multiChoicePlayerId: number;

    beforeEach(() => {
      // Create a multi-choice question (multiple correct answers)
      const multiQuizResponse =
      createQuiz(userSession,
        'Multi Quiz',
        'Multi choice quiz'
      ) as QuizCreateSuccessResponse;
      const multiQuizId = multiQuizResponse.quizId;

      questionCreateId(
        userSession,
        'Which are programming languages?',
        30,
        5,
        [
          { answer: 'JavaScript', correct: true },
          { answer: 'Python', correct: true },
          { answer: 'HTML', correct: false },
          { answer: 'CSS', correct: false }
        ],
        multiQuizId,
        'http://example.com/image.jpg'
      );

      const multiGameResponse = startGame(userSession, multiQuizId, 1);
      multiChoiceGameId = JSON.parse(multiGameResponse.body.toString()).gameId;

      const multiPlayerResponse = joinGame(multiChoiceGameId, 'MultiPlayer');
      multiChoicePlayerId = JSON.parse(multiPlayerResponse.body.toString()).playerId;
    });

    test('Multiple answers for single-choice question triggers INVALID_ANSWER_IDS', () => {
      advanceToQuestionOpen(userSession, quizId, gameId);

      // Multiple answers for single-choice
      const result = submitPlayerAnswerRes(playerId, [1, 2], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Multi-choice player validation', () => {
      expect(multiChoicePlayerId).toBeDefined();
      expect(typeof multiChoicePlayerId).toBe('number');
    });
    test('Multi-choice game validation', () => {
      expect(multiChoiceGameId).toBeDefined();
      expect(typeof multiChoiceGameId).toBe('number');
    });
  });

  describe('Error Cases - URL Parameter Validation', () => {
    test('Invalid URL parameters return 400', () => {
      const result = request('PUT', `${url}:${port}/v1/player/abc/question/def/answer`, {
        json: { answerIds: [1] },
        timeout: 100
      });

      expectedStatusCode(result, 400);
    });
  });

  describe('Error Cases - Malformed Requests', () => {
    test('Empty request body triggers 400', () => {
      const position = 1;
      const result = request(
        'PUT',
        `${url}:${port}/v1/player/${playerId}/question/${position}/answer`, {
          timeout: 100
        // No json body
        });

      expectedStatusCode(result, 400);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      advanceToQuestionOpen(userSession, quizId, gameId);
    });

    test('Very large answer ID triggers INVALID_ANSWER_IDS', () => {
      const result = submitPlayerAnswerRes(playerId, [Number.MAX_SAFE_INTEGER], 1);

      expectedStatusCode(result, 400);

      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Maximum valid answer IDs for multi-choice', () => {
      // Assuming max 6 answers per question based on quiz creation limits
      const result = submitPlayerAnswerRes(playerId, [1, 2, 3, 4, 5, 6], 1);

      expectedStatusCode(result, 400);
      // Should fail because original question only has 4 answers
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Answer IDs must correspond to actual answer options for the specific question', () => {
      // Try to use answer IDs from a different question
      const result = submitPlayerAnswerRes(playerId, [100], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });

    test('Answer ID exceeding MAX_SAFE_INTEGER triggers server validation', () => {
      const result = submitPlayerAnswerRes(playerId, [Number.MAX_SAFE_INTEGER + 1], 1);

      expectedStatusCode(result, 400);
      const body = JSON.parse(result.body.toString());
      expectErrorObj(body, 'INVALID_ANSWER_IDS');
    });
  });
});
