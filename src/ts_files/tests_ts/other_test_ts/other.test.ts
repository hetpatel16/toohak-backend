import request from 'sync-request-curl';
import config from './../../../config.json';
import {
  registerUser,
  createQuiz,
  getUserDetailsRes,
  listCreate,
  expectedStatusCode,
  clearData
} from './../test_helper_functions';
import { RegisterSuccessResponse } from '../../src_ts/interfaces';

const port = config.port;
const url = config.url;

describe('clear', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test('clear returns empty object when data does not exist', () => {
      const res = clearData();
      const bodyObj = JSON.parse(res.body as string);

      expect(res.statusCode).toStrictEqual(200);
      expect(bodyObj).toEqual({});
    });

    test('clear returns empty object when data existed previously', () => {
      const user = (registerUser('test@user.com', 'password123', 'test', 'user') as
        RegisterSuccessResponse).session;

      createQuiz(user, 'Test Quiz', 'A test quiz');

      const res = clearData();
      const bodyObj = JSON.parse(res.body as string);

      expect(res.statusCode).toStrictEqual(200);
      expect(bodyObj).toEqual({});
    });
  });

  /*
  we did not include an error cases section as the clear function has no parameters to validate
  and the clear function should always succeed regardless of the state of the data store.
  Therefor, it cannot fail under normal circumstances.
  */

  describe('Side Effect Cases', () => {
    test('clear removes all the user data from the data store', () => {
      const user = (registerUser('test@user.com', 'password123', 'test', 'user') as
        RegisterSuccessResponse).session;

      const userDetailsBeforeClear = getUserDetailsRes(user);
      expect(userDetailsBeforeClear.statusCode).toStrictEqual(200);

      clearData();

      const userDetailsAfterClear = getUserDetailsRes(user);
      expect(userDetailsAfterClear.statusCode).toStrictEqual(401);
    });

    test('clear removes all the quiz data from the data store', () => {
      const user = (registerUser('test@user.com', 'password123', 'test', 'user') as
        RegisterSuccessResponse).session;
      createQuiz(user, 'Test Quiz', 'A test quiz');

      const adminQuizBeforeClear = listCreate(user);
      const adminQuizBeforeCleanObj = JSON.parse(adminQuizBeforeClear.body as string);

      expectedStatusCode(adminQuizBeforeClear, 200);
      expect(adminQuizBeforeCleanObj.quizzes).toHaveLength(1);

      request('DELETE', `${url}:${port}/v1/clear`, { timeout: 100 });

      const adminQuizAfterClear = listCreate(user);

      expectedStatusCode(adminQuizAfterClear, 401);
    });

    test('clear removes both user and quiz data from the data store', () => {
      const user = (registerUser('test@user.com', 'password123', 'test', 'user') as
        RegisterSuccessResponse).session;
      createQuiz(user, 'Test Quiz', 'A test quiz');

      clearData();

      const userDetailsAfterClear = getUserDetailsRes(user);
      const adminQuizAfterClear = listCreate(user);

      expectedStatusCode(userDetailsAfterClear, 401);
      expectedStatusCode(adminQuizAfterClear, 401);
    });

    test('clear removes all the data when multiple users exist', () => {
      const user1 = (registerUser('test1@user.com', 'password123', 'test', 'one') as
        RegisterSuccessResponse).session;
      const user2 = (registerUser('test2@user.com', 'password456', 'testing', 'two') as
        RegisterSuccessResponse).session;

      clearData();

      const user1DetailsAfterClear = getUserDetailsRes(user1);
      const user2DetailsAfterClear = getUserDetailsRes(user2);

      expectedStatusCode(user1DetailsAfterClear, 401);
      expectedStatusCode(user2DetailsAfterClear, 401);
    });

    test('clear removes all the data when multiple quizzes exist', () => {
      const user = (registerUser('test@user.com', 'password123', 'test', 'user') as
        RegisterSuccessResponse).session;

      createQuiz(user, 'Test Quiz 1', 'first quiz');
      createQuiz(user, 'Test Quiz 2', 'second quiz');

      clearData();

      const quizListAfterClear = listCreate(user);
      expect(quizListAfterClear.statusCode).toStrictEqual(401);
    });
  });
});
