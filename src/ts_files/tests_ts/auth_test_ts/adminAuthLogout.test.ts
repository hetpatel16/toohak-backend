import request from 'sync-request-curl';
import config from './../../../config.json';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserDetailsRes,
  expectSuccessEmptyObj,
  expectErrorAuthLoginAuthLogout,
  expectedStatusCode,
  clearData
} from './../test_helper_functions';
import { RegisterSuccessResponse } from '../../src_ts/interfaces';

const port = config.port;
const url = config.url;

describe('adminAuthLogout', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test('successfully logs out with a valid sessionId', () => {
      const register = registerUser('test@user.com', 'test.password123', 'test', 'user');

      const logout = logoutUser((register as RegisterSuccessResponse).session);

      expectSuccessEmptyObj(logout);
    });

    test('successfully logs out with another valid sessionId', () => {
      const register = registerUser('test.another@user.com',
        'test.another.password123', 'another', 'user');

      const logout = logoutUser((register as RegisterSuccessResponse).session);

      expectSuccessEmptyObj(logout);
    });
  });

  describe('Error Cases', () => {
    test('logout with empty sessionId', () => {
      const result = logoutUser('');

      expectErrorAuthLoginAuthLogout(result, 401, 'UNAUTHORISED');
    });
    test('logout with white-space sessionId', () => {
      const result = logoutUser(' ');

      expectErrorAuthLoginAuthLogout(result, 401, 'UNAUTHORISED');
    });

    test('logout with no session header (sessionId is missing)', () => {
      const result = request('POST', `${url}:${port}/v1/admin/auth/logout`, { timeout: 100 });

      expectErrorAuthLoginAuthLogout(result, 401, 'UNAUTHORISED');
    });

    test('logout with non-existent sessionId', () => {
      const register = registerUser('test@user.com', 'test.password123', 'test', 'user');

      const result = logoutUser((register as RegisterSuccessResponse).session + 'invalid');

      expectErrorAuthLoginAuthLogout(result, 401, 'UNAUTHORISED');
    });

    test('logout with already logged out session', () => {
      const register = registerUser('test@user.com', 'test.password123', 'test', 'user');

      logoutUser((register as RegisterSuccessResponse).session);

      const secondLogoutResult = logoutUser((register as RegisterSuccessResponse).session);

      expectErrorAuthLoginAuthLogout(secondLogoutResult, 401, 'UNAUTHORISED');
    });
  });

  describe('Side Effect Cases', () => {
    test('current valid sessionId becomes invalid after logout', () => {
      const register = registerUser('test@user.com', 'test.password123', 'test', 'user');

      const detailsBeforeLogout = getUserDetailsRes((register as RegisterSuccessResponse).session);
      expectedStatusCode(detailsBeforeLogout, 200);

      const logout = logoutUser((register as RegisterSuccessResponse).session);
      expectSuccessEmptyObj(logout);

      const detailsAfterLogout = getUserDetailsRes((register as RegisterSuccessResponse).session);
      expectedStatusCode(detailsAfterLogout, 401);
    });

    test('registration session and login session are independent', () => {
      const register = (registerUser('test@user.com', 'test.password123', 'test', 'user') as
        RegisterSuccessResponse);

      const login = loginUser('test@user.com', 'test.password123');

      const loginBodyObj = JSON.parse(login.body as string);

      expect((register as RegisterSuccessResponse).session).not.toBe(loginBodyObj.session);

      const detailsRegistrationSession = getUserDetailsRes(register.session);

      const detailsLoginSession = getUserDetailsRes(loginBodyObj.session);

      expectedStatusCode(detailsRegistrationSession, 200);
      expectedStatusCode(detailsLoginSession, 200);

      const logout = logoutUser(register.session);
      expectedStatusCode(logout, 200);

      const detailsAfterRegisterLogout = getUserDetailsRes((register as
        RegisterSuccessResponse).session);
      const detailsAfterLoginLogout = getUserDetailsRes(loginBodyObj.session);

      expectedStatusCode(detailsAfterRegisterLogout, 401);
      expectedStatusCode(detailsAfterLoginLogout, 200);
    });

    test('other valid sessionId still works for the same user', () => {
      const registerOne = registerUser('user1@test.com', 'password123', 'User', 'One');
      const registerTwo = registerUser('user2@test.com', 'password456', 'User', 'Two');

      const detailsOne = getUserDetailsRes((registerOne as
        RegisterSuccessResponse).session);
      const detailsTwo = getUserDetailsRes((registerTwo as
        RegisterSuccessResponse).session);

      expectedStatusCode(detailsOne, 200);
      expectedStatusCode(detailsTwo, 200);

      const logoutOne = logoutUser((registerOne as
        RegisterSuccessResponse).session);
      expectedStatusCode(logoutOne, 200);

      const detailsAfterLogoutOne = getUserDetailsRes((registerOne as
        RegisterSuccessResponse).session);
      const detailsAfterLogoutTwo = getUserDetailsRes((registerTwo as
        RegisterSuccessResponse).session);

      expectedStatusCode(detailsAfterLogoutOne, 401);
      expectedStatusCode(detailsAfterLogoutTwo, 200);
    });
  });
});
