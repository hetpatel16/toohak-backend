import { RegisterSuccessResponse } from '../../src_ts/interfaces';
import {
  registerUser,
  loginUser,
  getUserDetailsRes,
  expectSuccessAuthLogin,
  expectErrorAuthLoginAuthLogout,
  clearData
} from './../test_helper_functions';

describe('adminAuthLogin', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test('login with valid email and password returning sessionId', () => {
      registerUser('test@user.com', 'test.password123', 'test', 'user');

      const res = loginUser('test@user.com', 'test.password123');
      expectSuccessAuthLogin(res);
    });

    test('login with another valid email and password returning sessionId', () => {
      registerUser('test.another@user.com', 'test.another.password123', 'another', 'user');

      const res = loginUser('test.another@user.com', 'test.another.password123');
      expectSuccessAuthLogin(res);
    });
  });

  describe('Error Cases', () => {
    test('email address does not exist', () => {
      const res = loginUser('not.registered@email.com', 'test.password123');
      expectErrorAuthLoginAuthLogout(res, 400, 'INVALID_CREDENTIALS');
    });

    test('password is not correct for the given email', () => {
      registerUser('test@user.com', 'correct.password123', 'test', 'user');

      const res = loginUser('test@user.com', 'incorrect.password123');
      expectErrorAuthLoginAuthLogout(res, 400, 'INVALID_CREDENTIALS');
    });

    test('trying to login with empty email', () => {
      const res = loginUser('', 'test.password123');
      expectErrorAuthLoginAuthLogout(res, 400, 'INVALID_CREDENTIALS');
    });

    test('trying to login with empty password', () => {
      const res = loginUser('test.another@user.com', '');
      expectErrorAuthLoginAuthLogout(res, 400, 'INVALID_CREDENTIALS');
    });
  });

  describe('Side Effect Cases', () => {
    test('successful login increases after login', () => {
      const registeredDetails = registerUser('test@user.com', 'test.password123', 'test', 'user');

      const initialDetails = getUserDetailsRes((registeredDetails as
        RegisterSuccessResponse).session);
      const initialDetailsObj = JSON.parse(initialDetails.body as string);
      const initialSuccessfulLogins = initialDetailsObj.user.numSuccessfulLogins;

      loginUser('test@user.com', 'test.password123');

      const updatedDetails = getUserDetailsRes((registeredDetails as
        RegisterSuccessResponse).session);
      const updatedDetailsObj = JSON.parse(updatedDetails.body as string);
      expect(updatedDetailsObj.user.numSuccessfulLogins).toBe(initialSuccessfulLogins + 1);
    });

    test('number of failed passwords increases after incorrect password is used', () => {
      const registeredDetails = registerUser('test@user.com',
        'correct.password123', 'test', 'user');

      const initialDetails = getUserDetailsRes((registeredDetails as
        RegisterSuccessResponse).session);
      const initialDetailsObj = JSON.parse(initialDetails.body as string);
      const initFailedPasswords = initialDetailsObj.user.numFailedPasswordsSinceLastLogin;

      loginUser('test@user.com', 'incorrect.password456');

      const updatedDetails = getUserDetailsRes((registeredDetails as
        RegisterSuccessResponse).session);
      const updatedDetailsObj = JSON.parse(updatedDetails.body as string);
      expect(
        updatedDetailsObj.user.numFailedPasswordsSinceLastLogin
      ).toBe(initFailedPasswords + 1);
    });

    test('number of failed passwords resets to 0 after correct password is used', () => {
      const registeredDetails = registerUser('test@user.com',
        'correct.password123', 'test', 'user');

      loginUser('test@user.com', 'incorrect.password456');

      const updatedDetails = getUserDetailsRes((registeredDetails as
        RegisterSuccessResponse).session);
      const updatedDetailsObj = JSON.parse(updatedDetails.body as string);
      expect(updatedDetailsObj.user.numFailedPasswordsSinceLastLogin).toBeGreaterThan(0);

      loginUser('test@user.com', 'correct.password123');

      const finalDetails = getUserDetailsRes((registeredDetails as
        RegisterSuccessResponse).session);
      const finalDetailsObj = JSON.parse(finalDetails.body as string);
      expect(finalDetailsObj.user.numFailedPasswordsSinceLastLogin).toBe(0);
    });
  });
});
