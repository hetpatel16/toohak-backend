import request from 'sync-request-curl';
import config from './../../../config.json';
import {
  registerUser,
  updatePassword,
  expectSuccessEmptyObj,
  loginUser,
  getUserDetailsRes,
  expectErrorUserPassword,
  clearData
} from './../test_helper_functions';
import { RegisterSuccessResponse } from '../../src_ts/interfaces';

const port = config.port;
const url = config.url;

describe('adminUserPasswordUpdate', () => {
  beforeEach(() => {
    clearData();
  });

  describe('Success Cases', () => {
    test('update password with valid sessionId,correct old password and valid new password', () => {
      const register = registerUser('test@user.com', 'old.password123', 'test', 'user');
      const update = updatePassword((register as RegisterSuccessResponse).session,
        'old.password123', 'new.password456');

      expectSuccessEmptyObj(update);
    });

    test('update password with another valid user with different credentials', () => {
      const register = registerUser('test.another@user.com',
        'another.old.password123', 'another', 'user');
      const update = updatePassword((register as RegisterSuccessResponse).session,
        'another.old.password123', 'another.new.password456');

      expectSuccessEmptyObj(update);
    });

    test('update password with minimum valid length', () => {
      const register = registerUser('test@user.com', 'old.pass123', 'test', 'user');
      const update = updatePassword((register as
        RegisterSuccessResponse).session, 'old.pass123', 'newPass1');

      expectSuccessEmptyObj(update);
    });
  });

  describe('Error Cases', () => {
    test('sessionId is not a valid user', () => {
      const register = registerUser('test@user.com', 'old.password123', 'test', 'user');
      const invalidSessionId = (register as
        RegisterSuccessResponse).session + '_invalid_suffix';
      const update = updatePassword(invalidSessionId, 'old.password123', 'new.password456');

      expectErrorUserPassword(update, 401, 'UNAUTHORISED');
    });

    test('sessionId is not part of the data store', () => {
      const register = registerUser('test@user.com', 'old.password123', 'test', 'user');
      const update = updatePassword((register as
        RegisterSuccessResponse).session + 'invalid',
      'old.password123', 'new.password456');

      expectErrorUserPassword(update, 401, 'UNAUTHORISED');
    });

    test('sessionId is missing', () => {
      const res = request('PUT', `${url}:${port}/v1/admin/user/password`, {
        json: {
          oldPassword: 'old.password123',
          newPassword: 'new.password456'
        },
        timeout: 100
      });

      expectErrorUserPassword(res, 401, 'UNAUTHORISED');
    });

    test('Old Password is not the correct old password', () => {
      const register = registerUser('test@user.com', 'correct.old.password123', 'test', 'user');
      const update = updatePassword((register as
        RegisterSuccessResponse).session, 'incorrect.old.pass123', 'new.password456');

      expectErrorUserPassword(update, 400, 'INVALID_OLD_PASSWORD');
    });

    test('Old Password and New Password match exactly', () => {
      const register = registerUser('test@user.com', 'same.password123', 'test', 'user');
      const update = updatePassword((register as
        RegisterSuccessResponse).session, 'same.password123', 'same.password123');

      expectErrorUserPassword(update, 400, 'INVALID_NEW_PASSWORD');
    });

    test('New Password has already been used before by this user', () => {
      const register = registerUser('test@user.com', 'old.password123', 'test', 'user');

      updatePassword((register as
        RegisterSuccessResponse).session, 'old.password123', 'new.password456');

      const newLogin = loginUser('test@user.com', 'new.password456');
      const newLoginObj = JSON.parse(newLogin.body as string);

      const update = updatePassword(newLoginObj.session, 'new.password456', 'old.password123');

      expectErrorUserPassword(update, 400, 'INVALID_NEW_PASSWORD');
    });

    test('New Password is less than 8 characters', () => {
      const register = registerUser('test@user.com', 'old.password123', 'test', 'user');
      const update = updatePassword((register as
        RegisterSuccessResponse).session, 'old.password123', 'shortP1');

      expectErrorUserPassword(update, 400, 'INVALID_NEW_PASSWORD');
    });

    test('New Password does not contain at least one number and at least one letter', () => {
      const register = registerUser('test@user.com', 'old.password123', 'test', 'user');
      const update = updatePassword((register as

        RegisterSuccessResponse).session, 'old.password123', '!@#$%^&*');

      expectErrorUserPassword(update, 400, 'INVALID_NEW_PASSWORD');
    });

    test('New Password does not contain at least one number', () => {
      const register = registerUser('test@user.com', 'old.password123', 'test', 'user');
      const update = updatePassword((register as
        RegisterSuccessResponse).session, 'old.password123', 'newPassword');

      expectErrorUserPassword(update, 400, 'INVALID_NEW_PASSWORD');
    });

    test('New Password does not contain at least one letter', () => {
      const register = registerUser('test@user.com', 'old.password123', 'test', 'user');
      const update = updatePassword((register as
        RegisterSuccessResponse).session, 'old.password123', '12345678');

      expectErrorUserPassword(update, 400, 'INVALID_NEW_PASSWORD');
    });
  });

  describe('Side Effect Cases', () => {
    test('user can login with new password after successful password update', () => {
      const register = (registerUser('test@user.com', 'old.password123', 'test', 'user') as
        RegisterSuccessResponse);

      expect(register).toEqual({ session: expect.any(String) });

      updatePassword((register as
        RegisterSuccessResponse).session, 'old.password123', 'new.password456');

      const newlogin = loginUser('test@user.com', 'new.password456');
      const newloginObj = JSON.parse(newlogin.body as string);
      expect(newloginObj).toEqual({ session: expect.any(String) });
    });

    test('user cannot login with old password after successful password update', () => {
      const register = (registerUser('test@user.com', 'old.password123', 'test', 'user') as
        RegisterSuccessResponse);

      updatePassword(register.session, 'old.password123', 'new.password456');

      const failedLogin = loginUser('test@user.com', 'old.password123');
      expectErrorUserPassword(failedLogin, 400, 'INVALID_CREDENTIALS');
    });

    test('other user details are not affected by password update', () => {
      const register = (registerUser('test@user.com', 'old.password123', 'test', 'user') as
        RegisterSuccessResponse);

      const initialDetails = getUserDetailsRes(register.session);
      const initialDetailsObj = JSON.parse(initialDetails.body as string);

      updatePassword(register.session, 'old.password123', 'new.password456');

      const updatedDetails = getUserDetailsRes(register.session);
      const updatedDetailsObj = JSON.parse(updatedDetails.body as string);

      expect(updatedDetailsObj.user.userId).toBe(initialDetailsObj.user.userId);
      expect(updatedDetailsObj.user.name).toBe(initialDetailsObj.user.name);
      expect(updatedDetailsObj.user.email).toBe(initialDetailsObj.user.email);
    });

    test('login works after multiple successful password updates', () => {
      const register = (registerUser('test@user.com', 'old.password123', 'test', 'user') as
        RegisterSuccessResponse);

      let update = updatePassword(register.session, 'old.password123', 'new.password456');
      expectSuccessEmptyObj(update);

      const loginTwo = loginUser('test@user.com', 'new.password456');
      const loginTwoObj = JSON.parse(loginTwo.body as string);

      update = updatePassword(loginTwoObj.session, 'new.password456', 'new.password789');
      expectSuccessEmptyObj(update);

      const finalLogin = loginUser('test@user.com', 'new.password789');
      const FinalLoginObj = JSON.parse(finalLogin.body as string);
      expect(FinalLoginObj).toEqual({ session: expect.any(String) });
    });

    test('failed password update does not change the original password', () => {
      const register = (registerUser('test@user.com', 'old.password123', 'test', 'user') as
        RegisterSuccessResponse);

      updatePassword(register.session, 'old.password123', 'newp');

      const testLogin = loginUser('test@user.com', 'old.password123');
      const testLoginObj = JSON.parse(testLogin.body as string);
      expect(testLoginObj).toEqual({ session: expect.any(String) });
    });

    test('password history prevents reuse after multiple changes', () => {
      const register = registerUser('test@user.com', 'password1', 'test', 'user');
      let session = (register as RegisterSuccessResponse).session;

      updatePassword(session, 'password1', 'password2');
      const login2 = loginUser('test@user.com', 'password2');
      session = (JSON.parse(login2.body as string)).session;

      updatePassword(session, 'password2', 'password3');
      const login3 = loginUser('test@user.com', 'password3');
      session = (JSON.parse(login3.body as string)).session;

      const update = updatePassword(session, 'password3', 'password1');
      expectErrorUserPassword(update, 400, 'INVALID_NEW_PASSWORD');
    });
  });
});
