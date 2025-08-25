import {
  UserDetailsSuccessResponse,
  ErrorResponse,
  RegisterSuccessResponse
} from '../../src_ts/interfaces';
import {
  registerUser,
  loginUser,
  getUserDetailsBody,
  expectSuccessUserDetails,
  expectErrorUserDetails,
  clearData,
  createAndValidateUser,
  expectErrorAuthLoginAuthLogout,
  expectSuccessAuthLogin
} from './../test_helper_functions';

describe('adminUserDetails', () => {
  beforeEach(() => {
    clearData();
  });
  describe('Success Cases', () => {
    // Tests for details of a valid user and checks for numFailedPasswordsSinceLastLogin to be zero
    test('Get details for valid user returns correct information', () => {
      const registerResult = registerUser('test@example.com', 'Password123', 'John', 'Smith');

      const result = getUserDetailsBody((registerResult as RegisterSuccessResponse).session) as
        UserDetailsSuccessResponse;

      expectSuccessUserDetails(result, expect.any(Number), 'John Smith', 'test@example.com');
      expect((result as UserDetailsSuccessResponse).user.numSuccessfulLogins).toBe(1);
      expect((result as UserDetailsSuccessResponse).user.numFailedPasswordsSinceLastLogin).toBe(0);
    });

    // Tests for getting details of multiple users, for user data affecting each other
    describe('Multiple users with helpers', () => {
      test('Different users have different user IDs', () => {
        const result1 = createAndValidateUser('user1@example.com', 'Password123', 'John', 'Smith');
        const result2 = createAndValidateUser('user2@example.com', 'Password456', 'Jane', 'Doe');

        expect((result1 as UserDetailsSuccessResponse).user.userId)
          .not.toBe((result2 as UserDetailsSuccessResponse).user.userId);
      });
    });

    // Tests if the numFailedPasswordsSinceLastLogin resets after a failed login
    test('Failed login increments counter and successful login resets it', () => {
      const registerResult = registerUser('test@example.com', 'Password123', 'John', 'Smith');
      const sessionId = (registerResult as RegisterSuccessResponse).session;

      // After registration, counters should be 1 success, 0 fail
      let result = getUserDetailsBody(sessionId) as UserDetailsSuccessResponse;

      expectSuccessUserDetails(result, expect.any(Number), 'John Smith', 'test@example.com');
      expect((result as UserDetailsSuccessResponse).user.numSuccessfulLogins).toBe(1);
      expect((result as UserDetailsSuccessResponse).user.numFailedPasswordsSinceLastLogin).toBe(0);

      // Failed login attempt, also checks if the login actually failed
      const failLoginResultRes = loginUser('test@example.com', 'WrongPassword123');
      expectErrorAuthLoginAuthLogout(failLoginResultRes, 400);

      // After failed login, fail count should be 1
      result = getUserDetailsBody(sessionId) as UserDetailsSuccessResponse;
      expect((result as UserDetailsSuccessResponse).user.numFailedPasswordsSinceLastLogin).toBe(1);

      // Successful login attempt
      const successLoginResultRes = loginUser('test@example.com', 'Password123');
      expectSuccessAuthLogin(successLoginResultRes);

      // Counter should be equal to 0 and the successful logins should be more than 1
      result = getUserDetailsBody(sessionId) as UserDetailsSuccessResponse;
      expect((result as UserDetailsSuccessResponse).user.numFailedPasswordsSinceLastLogin).toBe(0);
      expect((result as UserDetailsSuccessResponse).user.numSuccessfulLogins).toBeGreaterThan(1);
    });

    // Tests for names with special characters => -'
    describe('Names with special characters', () => {
      test.each([
        ['Mary-Jane', 'O\'Connor', 'Mary-Jane O\'Connor'],
        ['John', 'O\'Neil-Smith', 'John O\'Neil-Smith'],
        ['Anne-Marie', 'Van Der Berg', 'Anne-Marie Van Der Berg'],
        ['O\'Connor', 'Smith-Jones', 'O\'Connor Smith-Jones'],
        ['Jean-Claude', 'Van-Damme', 'Jean-Claude Van-Damme'],
        ['Mary\'s', 'O\'Brian-Wilson', 'Mary\'s O\'Brian-Wilson'],
        ['D\'Angelo', 'De-La-Cruz', 'D\'Angelo De-La-Cruz']
      ])('Name: %s %s returns correct full name', (firstName, lastName, expectedFullName) => {
        const registerResult = registerUser('test@example.com', 'Password123', firstName, lastName);
        const result = getUserDetailsBody((registerResult as RegisterSuccessResponse).session) as
          UserDetailsSuccessResponse;
        expectSuccessUserDetails(result, expect.any(Number), expectedFullName, 'test@example.com');
      });
    });
  });

  describe('Error Cases', () => {
    describe('Invalid session IDs', () => {
      const registerResult = registerUser('test@example0.com', 'Password1230', 'Shahi', 'Mint');
      const sessionId = (registerResult as RegisterSuccessResponse).session;
      test.each([
        ['Non-existent session ID', sessionId + 1],
        ['Session ID with special characters', sessionId + '@#$@#$#@']
      ])('%s returns UNAUTHORISED', (description, invalidSessionId) => {
        const result = getUserDetailsBody(invalidSessionId) as ErrorResponse;
        expectErrorUserDetails(result, 'UNAUTHORISED');
      });
    });

    // Tests for accessing user details after user data is cleared
    test('User details not accessible after clear', () => {
      const registerResult = registerUser('test@example.com', 'Password123', 'John', 'Smith');

      // Check user exists first
      const beforeClear = getUserDetailsBody((registerResult as RegisterSuccessResponse).session) as
        UserDetailsSuccessResponse;
      expectSuccessUserDetails(beforeClear, expect.any(Number), 'John Smith', 'test@example.com');

      // Clear data and then try to access it
      clearData();
      const afterClear = getUserDetailsBody((registerResult as RegisterSuccessResponse).session);
      expectErrorUserDetails(afterClear as ErrorResponse, 'UNAUTHORISED');
    });
  });

  describe('Side Effect Cases', () => {
    // Test that getting user details doesn't modify the user data
    test('Getting user details does not modify user state', () => {
      const registerResult = registerUser('test@example.com', 'Password123', 'John', 'Smith');

      const result1 = getUserDetailsBody((registerResult as RegisterSuccessResponse).session);
      const result2 = getUserDetailsBody((registerResult as RegisterSuccessResponse).session);

      expect(result1).toEqual(result2);
    });

    // Test that multiple calls to user details return consistent results
    test('Multiple calls return consistent results', () => {
      const registerResult = registerUser('test@example.com', 'Password123', 'John', 'Smith');

      const results = [];
      for (let i = 0; i < 3; i++) {
        results.push(getUserDetailsBody((registerResult as RegisterSuccessResponse).session));
      }

      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });
  });
});
