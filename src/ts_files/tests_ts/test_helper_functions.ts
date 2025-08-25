import request from 'sync-request-curl';
import { Response } from 'sync-request-curl';
import config from './../../config.json';
import {
  AuthRegisterReturn,
  ErrorResponse,
  ErrorTypes,
  QuizCreateSuccessResponse,
  RegisterSuccessResponse,
  UserDetailsReturn,
  UserDetailsSuccessResponse,
} from '../src_ts/interfaces';

const port = config.port;
const url = config.url;

type QuestionDeleteResponse = Record<string, never> | ErrorResponse;

export function expectErrorObj(result: ErrorResponse, errorType: string) {
  expect(result).toEqual({
    error: errorType,
    message: expect.any(String)
  });
}

// auth_test_ts

/**
 *
 * @param email
 * @param password
 * @param nameFirst
 * @param nameLast
 * @returns
 */
export function registerUser (email: string, password: string,
  nameFirst: string, nameLast: string): AuthRegisterReturn {
  const response = request('POST', `${url}:${port}/v1/admin/auth/register`, {
    json: {
      email,
      password,
      nameFirst,
      nameLast,
    },
    timeout: 100
  });
  return JSON.parse(response.body as string);
}

/**
 *
 * @param result
 */
export function expectSuccessAuthRegister (result: AuthRegisterReturn) {
  expect(result as RegisterSuccessResponse).toEqual({ session: expect.any(String) });
}

/**
 *
 * @param result
 * @param errorType
 */
export function expectErrorAuthRegister (result: AuthRegisterReturn, errorType: string) {
  expectErrorObj(result as ErrorResponse, errorType);
}

// login user
export function loginUser (email: string, password: string): Response {
  const res = request('POST', `${url}:${port}/v1/admin/auth/login`, {
    json: {
      email,
      password
    },
    timeout: 100
  });
  return res;
}

export function loginUserBody(email: string, password: string): {session : string} {
  const res = request('POST', `${url}:${port}/v1/admin/auth/login`, {
    json: { email, password },
    timeout: 100
  });
  return JSON.parse(res.body.toString());
}

export function expectSuccessAuthLogin(res: Response) {
  const result = JSON.parse(res.body as string);
  expectedStatusCode(res, 200);
  expectSuccessAuthRegister(result);
}

export function expectErrorAuthLoginAuthLogout(res: Response,
  statusCode: number, expectedErroType?: string) {
  const result = JSON.parse(res.body as string);
  expectedStatusCode(res, statusCode);

  if (!expectedErroType) {
    expectErrorObj(result, expect.any(String));
  } else {
    expectErrorObj(result, expectedErroType);
  }
}

// logout user
export function logoutUser (session: string): Response {
  const res = request('POST', `${url}:${port}/v1/admin/auth/logout`, {
    headers: {
      session: session
    },
    timeout: 5 * 1000
  });
  return res;
}

// expect empty object
export function expectSuccessEmptyObj (res: Response) {
  const result = JSON.parse(res.body.toString());
  expect(result).toStrictEqual({});
  expectedStatusCode(res, 200);
}

// expect specific status code
export function expectedStatusCode(res: Response, statusCode: number) {
  expect(res.statusCode).toStrictEqual(statusCode);
}

// get user's details
export function getUserDetailsRes(session: string): Response {
  const response = request('GET', `${url}:${port}/v1/admin/user/details`, {
    headers: { session: session }
  });
  return response;
}

export function getUserDetailsBody(session: string): UserDetailsReturn {
  const response = request('GET', `${url}:${port}/v1/admin/user/details`, {
    headers: { session: session }
  });
  return JSON.parse(response.body as string);
}

export function createAndValidateUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string) {
  const user = registerUser(email, password, firstName, lastName);
  const result = getUserDetailsBody((user as RegisterSuccessResponse).session);
  expectSuccessUserDetails(
    result as UserDetailsSuccessResponse,
    expect.any(Number),
    `${firstName} ${lastName}`,
    email);
  return result;
}

export function expectSuccessUserDetails (result: UserDetailsSuccessResponse,
  expectedUserId: number, expectedName: string,
  expectedEmail: string) {
  expect(result).toEqual({
    user: {
      userId: expectedUserId,
      name: expectedName,
      email: expectedEmail,
      numSuccessfulLogins: expect.any(Number),
      numFailedPasswordsSinceLastLogin: expect.any(Number),
    }
  });
}

export function expectErrorUserDetails (result: ErrorResponse, errorType: string) {
  expectErrorObj(result, errorType);
}

// update password
export function updatePassword (session: string,
  oldPassword: string, newPassword: string): Response {
  const updateRes = request(
    'PUT', `${url}:${port}/v1/admin/user/password`, {
      headers: {
        session: session
      },
      json: {
        oldPassword: oldPassword,
        newPassword: newPassword
      },
      timeout: 5 * 1000
    });
  return updateRes;
}

export function expectErrorUserPassword(res: Response,
  statusCode: number, expectedErroType: string) {
  const result = JSON.parse(res.body as string);
  expectedStatusCode(res, statusCode);
  expectErrorObj(result, expectedErroType);
}
// other_test_ts

// clear data
export function clearData (): Response {
  const res = request('DELETE', `${url}:${port}/v1/clear`);
  return res;
}

// quiz_test_ts

// create quiz
export function createQuiz (sessionId: string, name: string, description: string):
QuizCreateSuccessResponse | ErrorResponse {
  const response = request('POST', `${url}:${port}/v1/admin/quiz`, {
    json: { name, description },
    headers: { session: sessionId }
  });
  return JSON.parse(response.body.toString());
}

export function expectSuccessQuizCreate (result: QuizCreateSuccessResponse) {
  expect(result).toEqual({ quizId: expect.any(Number) });
}

export function expectErrorQuizCreate (
  result: ErrorResponse,
  errorType: string,
  messageSubstring?: string) {
  expectErrorObj(result, errorType);
  if (messageSubstring) {
    expect(result.message.toLowerCase()).toContain(messageSubstring.toLowerCase());
  }
}

export function expectErrorQuiz (status: number, res: Response) {
  const result = JSON.parse(res.body.toString());
  expectedStatusCode(res, status);
  expectErrorObj(result, expect.any(String));
}

// quiz info
export function quizInfo(sessionId: string, quizId: number) : Response {
  const infoRes = request(
    'GET',
  `${url}:${port}/v1/admin/quiz/${quizId}`,
  {
    headers: { session: sessionId },
    timeout: 5 * 1000
  }
  );
  return infoRes;
}

// list quiz details
export function listCreate(sessionId: string) : Response {
  const listRes = request(
    'GET',
        `${url}:${port}/v1/admin/quiz/list`,
        {
          headers: { session: sessionId },
          timeout: 5 * 1000
        }
  );
  return listRes;
}

// update quiz's name
export function updateName(sessionId:string, name:string, quizid:number): Response {
  const res = request(
    'PUT',
    `${url}:${port}/v1/admin/quiz/${quizid}/name`,
    {
      headers: {
        session: sessionId,
      },
      json: {
        name: name
      }
    }
  );
  return res;
}
// update quiz's description
export function updateDescription(sessionid: string,
  quizid: number,
  newDescription: string): Response {
  const res = request(
    'PUT',
    `${url}:${port}/v1/admin/quiz/${quizid}/description`,
    {
      headers: {
        session: sessionid,
      },
      json: {
        description: newDescription
      }
    }
  );
  return res;
}

// update quiz's thumbnail
export function updateThumbnail(sessionid: string, quizId: number, newThumbnail: string): Response {
  const res = request(
    'PUT',
    `${url}:${port}/v1/admin/quiz/${quizId}/thumbnail`,
    {
      headers: {
        session: sessionid,
      },
      json: {
        thumbnailUrl: newThumbnail
      }
    }
  );
  return res;
}
// remove quiz
export function removeQuiz(sessionid:string, quizId: number): Response {
  const res = request(
    'DELETE',
    `${url}:${port}/v1/admin/quiz/${quizId}`,
    {
      headers: {
        session: sessionid,
      },
      timeout: 5 * 1000
    }
  );
  return res;
}

// removeQuiz v2
export function removeQuizV2(sessionid:string, quizId: number): Response {
  const res = request(
    'DELETE',
    `${url}:${port}/v2/admin/quiz/${quizId}`,
    {
      headers: {
        session: sessionid,
      },
      timeout: 5 * 1000
    }
  );
  return res;
}

// create new question
export function questionCreateId(
  sessionId: string,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions:{answer: string, correct: boolean}[],
  quizId: number,
  thumbnailUrl: string): {id: number} {
  const questionRes = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizId}/question`,
    {
      headers: { session: sessionId },
      json: {
        questionBody: {
          question,
          timeLimit,
          points,
          answerOptions,
          thumbnailUrl,
        }
      },
      // adding a timeout will help you spot when your server hangs
      timeout: 5 * 1000
    }
  );

  const id = JSON.parse(questionRes.body as string).questionId;

  return { id };
}

export function questionCreateRes(
  sessionId: string,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions:{answer: string, correct: boolean}[],
  quizId: number,
  thumbnailUrl: string): Response {
  const questionRes = request(
    'POST',
    `${url}:${port}/v1/admin/quiz/${quizId}/question`,
    {
      headers: { session: sessionId },
      json: {
        questionBody: {
          question,
          timeLimit,
          points,
          answerOptions,
          thumbnailUrl,
        }
      },
      // adding a timeout will help you spot when your server hangs
      timeout: 5 * 1000
    }
  );
  return questionRes;
}

// update question
export function updateQuestion(
  sessionId: string,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions:{answer: string, correct: boolean}[],
  thumbnailUrl: string,
  quizId: number,
  questionId: number): Response {
  const updateRes = request(
    'PUT',
      `${url}:${port}/v1/admin/quiz/${quizId}/question/${questionId}`,
      {
        headers: { session: sessionId },
        json: {
          questionBody: {
            question,
            timeLimit,
            points,
            answerOptions,
            thumbnailUrl,
          }
        },
        // adding a timeout will help you spot when your server hangs
        timeout: 5 * 1000
      }
  );

  return updateRes;
}

// delete question

export function deleteQuestion(session: string, quizId: number, questionId: number) {
  return request('DELETE', `${url}:${port}/v1/admin/quiz/${quizId}/question/${questionId}`, {
    headers: { session },
    timeout: 5 * 1000
  });
}

export function deleteQuestionV2(session: string, quizId: number, questionId: number) {
  return request('DELETE', `${url}:${port}/v2/admin/quiz/${quizId}/question/${questionId}`, {
    headers: { session: session },
    timeout: 5 * 1000
  });
}

export function deleteQuestionWithoutSession(quizId: number, questionId: number) {
  return request('DELETE', `${url}:${port}/v1/admin/quiz/${quizId}/question/${questionId}`, {
    timeout: 5 * 1000
  });
}

export function deleteQuestionV2WithoutSession(quizId: number, questionId: number) {
  return request('DELETE', `${url}:${port}/v2/admin/quiz/${quizId}/question/${questionId}`, {
    timeout: 5 * 1000
  });
}

export function generateNonExistentId(baseId: number): number {
  return baseId + 10000;
}

export function expectSuccessDeleteQuestion(result: QuestionDeleteResponse) {
  expect(result).toEqual({});
}

export function expectErrorDeleteQuestion (result: QuestionDeleteResponse, errorType: ErrorTypes) {
  expectErrorObj(result as ErrorResponse, errorType);
}

/**
 *
 * @param session
 * @param email
 * @param nameFirst
 * @param nameLast
 * @returns
 */
export function detailsUpdate(session: string,
  email: string,
  nameFirst: string,
  nameLast: string) : Response {
  const res = request(
    'PUT',
    `${url}:${port}/v1/admin/user/details`,
    {
      headers: { session: session },

      json: {
        email: email,
        nameFirst: nameFirst,
        nameLast: nameLast
      },
      timeout: 5 * 1000
    }
  );
  return res;
}

/**
 * Given status code and response, expect an error
 * @param status
 * @param res
 */
export function expectErrorDetailsUpdate(status: number, res: Response) {
  const result = JSON.parse(res.body.toString());
  expectedStatusCode(res, status);
  expectErrorObj(result, expect.any(String));
}

// start new game
export function startGame(sessionId: string, quizId: number, autoStartNum: number): Response {
  const res = request('POST', `${url}:${port}/v1/admin/quiz/${quizId}/game/start`, {
    headers: {
      session: sessionId
    },
    json: {
      autoStartNum: autoStartNum
    },
    timeout: 5 * 1000
  });
  return res;
}

/**
 *
 * @param res
 */
export function expectSuccessGameStart(res: Response) {
  const result = JSON.parse(res.body.toString());
  expect(result).toStrictEqual({ gameId: expect.any(Number) });
}

/**
 *
 * @param playerId
 * @returns
 */
export function getPlayerStatus(playerId: number) {
  return request('GET', `${url}:${port}/v1/player/${playerId}`, {
    timeout: 5 * 1000
  });
}

/**
 *
 * @param gameId
 * @param playerName
 * @returns
 */
export function joinGame(gameId: number, playerName: string) {
  return request('POST', `${url}:${port}/v1/player/join`, {
    json: {
      gameId,
      playerName
    },
    timeout: 5 * 1000
  });
}

/**
 *
 * @param playerId
 * @param questionPosition
 * @returns
 */
export function getPlayerQuestionInfo(playerId: number, questionPosition: number) {
  return request('GET', `${url}:${port}/v1/player/${playerId}/question/${questionPosition}`, {
    timeout: 5 * 1000
  });
}

/**
 *
 * @param playerId
 * @returns
 */
export function getPlayerGameResults(playerId: number) {
  return request('GET', `${url}:${port}/v1/player/${playerId}/results`, {
    timeout: 5 * 1000
  });
}

// adminQuizGameView
export function viewGame(session: string, quizId: number) {
  const res = request('GET', `${url}:${port}/v1/admin/quiz/${quizId}/games`, {
    headers: {
      session: session
    },
    timeout: 5 * 1000
  }
  );
  return res;
}

export function expectError(res: Response, statusCode: number) {
  const resBody = JSON.parse(res.body.toString());
  expectedStatusCode(res, statusCode);
  expectErrorObj(resBody, expect.any(String));
}
export function gameStatus(session: string, quizId: number, gameId: number) {
  const res = request('GET', `${url}:${port}/v1/admin/quiz/${quizId}/game/${gameId}`, {
    headers: {
      session: session
    },
    timeout: 5 * 1000
  }
  );

  return res;
}

// adminQuizGameUpdate
export function updateGameState(
  session: string,
  quizid: number,
  gameid: number,
  action: string
): Response {
  const res = request('PUT', `${url}:${port}/v1/admin/quiz/${quizid}/game/${gameid}`, {
    headers: {
      session: session
    },
    json: {
      action: action
    },
    timeout: 5 * 1000
  });
  return res;
}
/**
 *
 * @param session
 * @param quizid
 * @param gameid
 * @returns
 */
export function gameResult (session: string, quizid: number,
  gameid: number
) {
  const res = request('GET', `${url}:${port}/v1/admin/quiz/${quizid}/game/${gameid}/results`, {
    headers: {
      session: session
    },
    timeout: 5 * 1000
  });

  return res;
}

export function expectState(state: string, expectedState: string) {
  expect(state).toStrictEqual(expectedState);
}

// playerAnswerSubmit
export function submitPlayerAnswerRes(
  playerId: number,
  answerIds: number[],
  questionPosition: number): Response {
  const res = request(
    'PUT',
    `${url}:${port}/v1/player/${playerId}/question/${questionPosition}/answer`,
    {
      json: { answerIds: answerIds },
      timeout: 5 * 1000
    });
  return res;
}

export function advanceToQuestionOpen(userSession: string, quizId: number, gameId: number) {
  // Move to QUESTION_COUNTDOWN
  const nextResponse = updateGameState(userSession, quizId, gameId, 'NEXT_QUESTION');
  if (nextResponse.statusCode !== 200) {
    throw new Error(`Failed to advance to QUESTION_COUNTDOWN: ${nextResponse.body.toString()}`);
  }

  // Move to QUESTION_OPEN
  const skipResponse = updateGameState(userSession, quizId, gameId, 'SKIP_COUNTDOWN');
  if (skipResponse.statusCode !== 200) {
    throw new Error(`Failed to advance to QUESTION_OPEN: ${skipResponse.body.toString()}`);
  }
}

// Helper function to get to QUESTION_OPEN state
export function advanceToQuestionClose(userSession: string, quizId: number, gameId: number) {
  // Move to QUESTION_COUNTDOWN
  const nextResponse = updateGameState(userSession, quizId, gameId, 'NEXT_QUESTION');
  if (nextResponse.statusCode !== 200) {
    throw new Error(`Failed to advance to QUESTION_COUNTDOWN: ${nextResponse.body.toString()}`);
  }

  // Move to QUESTION_OPEN
  const skipResponse = updateGameState(userSession, quizId, gameId, 'SKIP_COUNTDOWN');
  if (skipResponse.statusCode !== 200) {
    throw new Error(`Failed to advance to QUESTION_OPEN: ${skipResponse.body.toString()}`);
  }

  // Move to QUESTION_CLOSE - try different possible action names
  let endResponse = updateGameState(userSession, quizId, gameId, 'END_QUESTION');
  if (endResponse.statusCode !== 200) {
    // Try alternative action names if END_QUESTION doesn't work
    endResponse = updateGameState(userSession, quizId, gameId, 'CLOSE_QUESTION');

    if (endResponse.statusCode !== 200) {
      endResponse = updateGameState(userSession, quizId, gameId, 'GO_TO_ANSWER');

      if (endResponse.statusCode !== 200) {
        throw new Error(
          `Failed to advance to QUESTION_CLOSE with any action: ${endResponse.body.toString()}`);
      }
    }
  }

  return endResponse;
}

export function advanceToAnswerShow(userSession: string, quizId: number, gameId: number) {
  // First get to QUESTION_CLOSE
  advanceToQuestionClose(userSession, quizId, gameId);

  // Move to ANSWER_SHOW
  let showResponse = updateGameState(userSession, quizId, gameId, 'SHOW_ANSWERS');
  if (showResponse.statusCode !== 200) {
    // Try alternative action name
    showResponse = updateGameState(userSession, quizId, gameId, 'SHOW_ANSWER');

    if (showResponse.statusCode !== 200) {
      throw new Error(`Failed to advance to ANSWER_SHOW: ${showResponse.body.toString()}`);
    }
  }

  return showResponse;
}
