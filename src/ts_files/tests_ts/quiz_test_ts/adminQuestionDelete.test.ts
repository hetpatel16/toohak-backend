import {
  QuizCreateSuccessResponse,
  ErrorTypes
} from '../../src_ts/interfaces';
import {
  registerUser,
  loginUserBody,
  createQuiz,
  deleteQuestion,
  deleteQuestionV2,
  expectSuccessDeleteQuestion,
  expectErrorDeleteQuestion,
  clearData,
  expectedStatusCode,
  questionCreateId,
  deleteQuestionWithoutSession,
  startGame,
  updateGameState,
  deleteQuestionV2WithoutSession
} from './../test_helper_functions';

export function generateNonExistentId(baseId: number): number {
  return baseId + 10000;
}

describe('Admin Question Delete - V1 and V2 Endpoints', () => {
  let user1Session: string;
  let user2Session: string;
  let quiz1Id: number;
  let question1Id: number;
  let question2Id: number;

  beforeEach(() => {
    clearData();

    // Register users
    registerUser('user1@example.com', 'password123', 'John', 'Doe');
    registerUser('user2@example.com', 'password456', 'Jane', 'Smith');

    // Login to get sessions
    const user1Login = loginUserBody('user1@example.com', 'password123');
    const user2Login = loginUserBody('user2@example.com', 'password456');

    user1Session = user1Login.session;
    user2Session = user2Login.session;

    // Create a quiz
    const quiz1 = createQuiz(user1Session, 'Test Quiz', 'A test quiz') as QuizCreateSuccessResponse;
    quiz1Id = quiz1.quizId;

    // Create questions
    const answerOptions = [
      { answer: '3', correct: false },
      { answer: '4', correct: true },
      { answer: '5', correct: false }
    ];

    question1Id = questionCreateId(
      user1Session, 'What is 2 + 2?', 30, 5, answerOptions, quiz1Id, 'http://example.jpg').id;
    question2Id = questionCreateId(
      user1Session, 'What is 3 + 3?', 30, 5, answerOptions, quiz1Id, 'http://example.jpg').id;
  });

  // =============================================================================
  // V1 ENDPOINT TESTS
  // =============================================================================
  describe('DELETE /v1/admin/quiz/{quizid}/question/{questionid}', () => {
    describe('Success cases', () => {
      test('Successfully delete a question from quiz', () => {
        const res = deleteQuestion(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 200);

        const result = JSON.parse(res.body.toString());
        expectSuccessDeleteQuestion(result);
      });

      test('Successfully delete first question', () => {
        const res = deleteQuestion(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 200);
        expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
      });

      test('Successfully delete second question', () => {
        const res = deleteQuestion(user1Session, quiz1Id, question2Id);
        expectedStatusCode(res, 200);
        expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
      });

      test('Delete question from quiz with only one question', () => {
        const singleQuiz = createQuiz(
          user1Session,
          'Single Question Quiz',
          'Quiz with one question') as QuizCreateSuccessResponse;

        const answerOptions = [
          { answer: 'Yes', correct: true },
          { answer: 'No', correct: false }
        ];

        const singleQuestionId = questionCreateId(
          user1Session,
          'Single question?',
          30,
          5,
          answerOptions,
          singleQuiz.quizId
          , 'http://exmaple.jpg').id;

        const res = deleteQuestion(user1Session, singleQuiz.quizId, singleQuestionId);
        expectedStatusCode(res, 200);
        expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
      });
    });

    describe('Error cases - 401 UNAUTHORISED', () => {
      test.each([
        ['invalid session', user2Session + 100],
        ['session with special characters', user1Session + '--!@$#@$@$@#$@#-']
      ])('Returns UNAUTHORISED for %s', (description: string, sessionValue: string) => {
        const res = deleteQuestion(sessionValue, quiz1Id, question1Id);
        expectedStatusCode(res, 401);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.UNAUTHORISED);
      });

      test('Returns UNAUTHORISED for no session header', () => {
        const res = deleteQuestionWithoutSession(quiz1Id, question1Id);
        expectedStatusCode(res, 401);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.UNAUTHORISED);
      });
    });

    describe('Error cases - 403 INVALID_QUIZ_ID', () => {
      test.each([
        ['negative quiz ID', quiz1Id - 10000],
        ['zero quiz ID', 0],
      ])('Returns INVALID_QUIZ_ID for %s', (
        description: string,
        quizId: number) => {
        const res = deleteQuestion(user1Session, quizId, question1Id);
        expectedStatusCode(res, 403);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.INVALID_QUIZ_ID);
      });

      test('Returns INVALID_QUIZ_ID for non-existent quiz', () => {
        const nonExistentQuizId = generateNonExistentId(quiz1Id);
        const res = deleteQuestion(user1Session, nonExistentQuizId, question1Id);
        expectedStatusCode(res, 403);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.INVALID_QUIZ_ID);
      });

      test('Returns INVALID_QUIZ_ID when user is not owner of quiz', () => {
        const res = deleteQuestion(user2Session, quiz1Id, question1Id);
        expectedStatusCode(res, 403);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.INVALID_QUIZ_ID);
      });
    });

    describe('Error cases - 400 INVALID_QUESTION_ID', () => {
      test('Returns INVALID_QUESTION_ID for non-existent question', () => {
        const nonExistentQuestionId = generateNonExistentId(question1Id);
        const res = deleteQuestion(user1Session, quiz1Id, nonExistentQuestionId);
        expectedStatusCode(res, 400);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.INVALID_QUESTION_ID);
      });
    });

    describe('State verification', () => {
      test('Question deletion persists after deletion', () => {
        const res = deleteQuestion(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 200);

        const res2 = deleteQuestion(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res2, 400);
        expectErrorDeleteQuestion(JSON.parse(res2.body.toString()), ErrorTypes.INVALID_QUESTION_ID);
      });

      test('Deletion does not affect other questions', () => {
        const res1 = deleteQuestion(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res1, 200);

        const res2 = deleteQuestion(user1Session, quiz1Id, question2Id);
        expectedStatusCode(res2, 200);
        expectSuccessDeleteQuestion(JSON.parse(res2.body.toString()));
      });
    });

    describe('Multiple operations', () => {
      test('Delete multiple questions in sequence', () => {
        const answerOptions = [
          { answer: 'A', correct: true },
          { answer: 'B', correct: false }
        ];

        const question3Id = questionCreateId(
          user1Session, 'Question 3?', 30, 5, answerOptions, quiz1Id, 'http://example.jpg').id;
        const question4Id = questionCreateId(
          user1Session, 'Question 4?', 30, 5, answerOptions, quiz1Id, 'http://example.jpg').id;
        const question5Id = questionCreateId(
          user1Session, 'Question 5?', 30, 5, answerOptions, quiz1Id, 'http://example.jpg').id;

        const questionsToDelete = [question1Id, question2Id, question3Id, question4Id, question5Id];

        questionsToDelete.forEach(qId => {
          const res = deleteQuestion(user1Session, quiz1Id, qId);
          expectedStatusCode(res, 200);
          expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
        });
      });
    });
  });

  // =============================================================================
  // V2 ENDPOINT TESTS - Includes game state validation
  // =============================================================================
  describe('DELETE /v2/admin/quiz/{quizid}/question/{questionid}', () => {
    describe('Success cases', () => {
      test('Successfully delete a question from quiz', () => {
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 200);

        const result = JSON.parse(res.body.toString());
        expectSuccessDeleteQuestion(result);
      });

      test('Successfully delete first question', () => {
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 200);
        expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
      });

      test('Successfully delete second question', () => {
        const res = deleteQuestionV2(user1Session, quiz1Id, question2Id);
        expectedStatusCode(res, 200);
        expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
      });

      test('Delete question from quiz with only one question', () => {
        const singleQuiz = createQuiz(
          user1Session,
          'Single Question Quiz',
          'Quiz with one question') as QuizCreateSuccessResponse;

        const answerOptions = [
          { answer: 'Yes', correct: true },
          { answer: 'No', correct: false }
        ];

        const singleQuestionId = questionCreateId(
          user1Session,
          'Single question?',
          30,
          5,
          answerOptions,
          singleQuiz.quizId,
          'http://example.jpg').id;

        const res = deleteQuestionV2(user1Session, singleQuiz.quizId, singleQuestionId);
        expectedStatusCode(res, 200);
        expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
      });

      test('Successfully delete question when all games are in END state', () => {
        // Start a game
        const gameRes = startGame(user1Session, quiz1Id, 3);
        expectedStatusCode(gameRes, 200);
        const gameData = JSON.parse(gameRes.body.toString());
        const gameId = gameData.gameId;

        // End the game by updating its state to END
        const endGameRes = updateGameState(user1Session, quiz1Id, gameId, 'END');
        expectedStatusCode(endGameRes, 200);

        // Now deletion should succeed
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 200);
        expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
      });
    });

    describe('Error cases - 401 UNAUTHORISED', () => {
      test.each([
        ['invalid session', user2Session + 100],
        ['session id contain special characters', user2Session + '@#%@%$%#%#$']
      ])('Returns UNAUTHORISED for %s', (description: string, sessionValue: string) => {
        const res = deleteQuestionV2(sessionValue, quiz1Id, question1Id);
        expectedStatusCode(res, 401);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.UNAUTHORISED);
      });

      test('Returns UNAUTHORISED for no session header', () => {
        const res = deleteQuestionV2WithoutSession(quiz1Id, question1Id);
        expectedStatusCode(res, 401);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.UNAUTHORISED);
      });
    });

    describe('Error cases - 403 INVALID_QUIZ_ID', () => {
      test.each([
        ['negative quiz ID', quiz1Id - 10000],
        ['zero quiz ID', 0],
      ])('Returns INVALID_QUIZ_ID for %s', (
        description: string, quizId: number) => {
        const res = deleteQuestionV2(user1Session, quizId, question1Id);
        expectedStatusCode(res, 403);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.INVALID_QUIZ_ID);
      });

      test('Returns INVALID_QUIZ_ID for non-existent quiz', () => {
        const nonExistentQuizId = generateNonExistentId(quiz1Id);
        const res = deleteQuestionV2(user1Session, nonExistentQuizId, question1Id);
        expectedStatusCode(res, 403);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.INVALID_QUIZ_ID);
      });

      test('Returns INVALID_QUIZ_ID when user is not owner of quiz', () => {
        const res = deleteQuestionV2(user2Session, quiz1Id, question1Id);
        expectedStatusCode(res, 403);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.INVALID_QUIZ_ID);
      });
    });

    describe('Error cases - 400 ACTIVE_GAME_EXISTS', () => {
      test('Returns ACTIVE_GAME_EXISTS when game is in LOBBY state', () => {
        // Start a game (which creates it in LOBBY state)
        const gameRes = startGame(user1Session, quiz1Id, 3);
        expectedStatusCode(gameRes, 200);

        // Try to delete question - should fail
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 400);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.ACTIVE_GAME_EXISTS);
      });

      test('Returns ACTIVE_GAME_EXISTS when game is in QUESTION_COUNTDOWN state', () => {
        const gameRes = startGame(user1Session, quiz1Id, 3);
        expectedStatusCode(gameRes, 200);

        const gameData = JSON.parse(gameRes.body.toString());
        const gameId = gameData.gameId;

        updateGameState(user1Session, quiz1Id, gameId, 'NEXT_QUESTION');

        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 400);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.ACTIVE_GAME_EXISTS);
      });

      test('Returns ACTIVE_GAME_EXISTS when game is in QUESTION_OPEN state', () => {
        // Start a game and move it to QUESTION_OPEN
        const gameRes = startGame(user1Session, quiz1Id, 3);
        expectedStatusCode(gameRes, 200);

        const gameData = JSON.parse(gameRes.body.toString());
        const gameId = gameData.gameId;

        // Move through states to get to QUESTION_OPEN
        updateGameState(user1Session, quiz1Id, gameId, 'NEXT_QUESTION');
        updateGameState(user1Session, quiz1Id, gameId, 'SKIP_COUNTDOWN');

        // Try to delete question - should fail
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 400);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.ACTIVE_GAME_EXISTS);
      });

      test('Returns ACTIVE_GAME_EXISTS when game is in QUESTION_CLOSE state', () => {
        // Start a game and move it to QUESTION_CLOSE
        const gameRes = startGame(user1Session, quiz1Id, 3);
        expectedStatusCode(gameRes, 200);

        const gameData = JSON.parse(gameRes.body.toString());
        const gameId = gameData.gameId;

        // Move through states to get to QUESTION_CLOSE
        updateGameState(user1Session, quiz1Id, gameId, 'NEXT_QUESTION');
        updateGameState(user1Session, quiz1Id, gameId, 'SKIP_COUNTDOWN');
        updateGameState(user1Session, quiz1Id, gameId, 'GO_TO_ANSWER');

        // Try to delete question - should fail
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 400);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.ACTIVE_GAME_EXISTS);
      });

      test('Returns ACTIVE_GAME_EXISTS when game is in ANSWER_SHOW state', () => {
        // Start a game and move it to ANSWER_SHOW
        const gameRes = startGame(user1Session, quiz1Id, 3);
        expectedStatusCode(gameRes, 200);

        const gameData = JSON.parse(gameRes.body.toString());
        const gameId = gameData.gameId;

        // Move through states to get to ANSWER_SHOW
        updateGameState(user1Session, quiz1Id, gameId, 'NEXT_QUESTION');
        updateGameState(user1Session, quiz1Id, gameId, 'SKIP_COUNTDOWN');
        updateGameState(user1Session, quiz1Id, gameId, 'GO_TO_ANSWER');

        // Try to delete question - should fail
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 400);
        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.ACTIVE_GAME_EXISTS);
      });

      test('Returns ACTIVE_GAME_EXISTS when game is in FINAL_RESULTS state', () => {
        // Start a game and move it to FINAL_RESULTS
        const gameRes = startGame(user1Session, quiz1Id, 3);
        expectedStatusCode(gameRes, 200);

        const gameData = JSON.parse(gameRes.body.toString());
        const gameId = gameData.gameId;

        // Move through states to get to FINAL_RESULTS
        updateGameState(user1Session, quiz1Id, gameId, 'NEXT_QUESTION');
        updateGameState(user1Session, quiz1Id, gameId, 'SKIP_COUNTDOWN');
        updateGameState(user1Session, quiz1Id, gameId, 'GO_TO_ANSWER');
        updateGameState(user1Session, quiz1Id, gameId, 'GO_TO_FINAL_RESULTS');

        // Try to delete question - should fail
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 400);
        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.ACTIVE_GAME_EXISTS);
      });

      test('Succeeds when multiple games exist but all are in END state', () => {
        // Start multiple games
        const game1Res = startGame(user1Session, quiz1Id, 3);
        const game2Res = startGame(user1Session, quiz1Id, 3);
        expectedStatusCode(game1Res, 200);
        expectedStatusCode(game2Res, 200);

        const game1Data = JSON.parse(game1Res.body.toString());
        const game2Data = JSON.parse(game2Res.body.toString());

        // End both games
        updateGameState(user1Session, quiz1Id, game1Data.gameId, 'END');
        updateGameState(user1Session, quiz1Id, game2Data.gameId, 'END');

        // Try to delete question - should succeed
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 200);
        expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
      });
    });

    describe('Error cases - 400 INVALID_QUESTION_ID', () => {
      test('Returns INVALID_QUESTION_ID for non-existent question', () => {
        const nonExistentQuestionId = generateNonExistentId(question1Id);
        const res = deleteQuestionV2(user1Session, quiz1Id, nonExistentQuestionId);
        expectedStatusCode(res, 400);

        const result = JSON.parse(res.body.toString());
        expectErrorDeleteQuestion(result, ErrorTypes.INVALID_QUESTION_ID);
      });
    });

    describe('State verification', () => {
      test('Question deletion persists after deletion', () => {
        const res = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res, 200);

        const res2 = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res2, 400);
        expectErrorDeleteQuestion(JSON.parse(res2.body.toString()), ErrorTypes.INVALID_QUESTION_ID);
      });

      test('Deletion does not affect other questions', () => {
        const res1 = deleteQuestionV2(user1Session, quiz1Id, question1Id);
        expectedStatusCode(res1, 200);

        const res2 = deleteQuestionV2(user1Session, quiz1Id, question2Id);
        expectedStatusCode(res2, 200);
        expectSuccessDeleteQuestion(JSON.parse(res2.body.toString()));
      });
    });

    describe('Multiple operations', () => {
      test('Delete multiple questions in sequence', () => {
        const answerOptions = [
          { answer: 'A', correct: true },
          { answer: 'B', correct: false }
        ];

        const question3Id = questionCreateId(
          user1Session, 'Question 3?', 30, 5, answerOptions, quiz1Id, 'http://exm.jpg').id;
        const question4Id = questionCreateId(
          user1Session, 'Question 4?', 30, 5, answerOptions, quiz1Id, 'http://exm.jpg').id;
        const question5Id = questionCreateId(
          user1Session, 'Question 5?', 30, 5, answerOptions, quiz1Id, 'http://exm.jpg').id;

        const questionsToDelete = [question1Id, question2Id, question3Id, question4Id, question5Id];

        questionsToDelete.forEach(qId => {
          const res = deleteQuestionV2(user1Session, quiz1Id, qId);
          expectedStatusCode(res, 200);
          expectSuccessDeleteQuestion(JSON.parse(res.body.toString()));
        });
      });

      test(
        'Cannot delete questions when active game exists, but can after game ends', () => {
          const gameRes = startGame(user1Session, quiz1Id, 3);
          expectedStatusCode(gameRes, 200);

          const gameData = JSON.parse(gameRes.body.toString());
          const gameId = gameData.gameId;

          // Try to delete question - should fail
          const deleteRes1 = deleteQuestionV2(user1Session, quiz1Id, question1Id);
          expectedStatusCode(deleteRes1, 400);
          expectErrorDeleteQuestion(
            JSON.parse(deleteRes1.body.toString()), ErrorTypes.ACTIVE_GAME_EXISTS);

          // End the game
          const endGameRes = updateGameState(user1Session, quiz1Id, gameId, 'END');
          expectedStatusCode(endGameRes, 200);

          // Now deletion should succeed
          const deleteRes2 = deleteQuestionV2(user1Session, quiz1Id, question1Id);
          expectedStatusCode(deleteRes2, 200);
          expectSuccessDeleteQuestion(JSON.parse(deleteRes2.body.toString()));
        });
    });
  });
});
