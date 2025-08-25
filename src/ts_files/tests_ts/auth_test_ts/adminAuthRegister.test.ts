import {
  RegisterSuccessResponse,
} from '../../src_ts/interfaces';
import {
  registerUser,
  expectSuccessAuthRegister,
  expectErrorAuthRegister,
  clearData
} from './../test_helper_functions';

describe('adminAuthRegister', () => {
  // Clear memory before each test
  beforeEach(() => {
    clearData();
  });
  describe('Success Cases', () => {
    // Test for 1 successful user being added
    test('Register with valid data returns userId', () => {
      const result = registerUser('test@example.com', 'Password123', 'John', 'Smith');
      expectSuccessAuthRegister(result);
    });

    // Test for 2/multiple users added
    test('Multiple users can register successfully', () => {
      const result1 = registerUser('test1@example.com', 'Password123', 'John', 'Smith');
      const result2 = registerUser('test2@example.com', 'Password123', 'Jane', 'Smith');

      expectSuccessAuthRegister(result1);
      expectSuccessAuthRegister(result2);
      const result1R = (result1 as RegisterSuccessResponse);
      const result2R = (result2 as RegisterSuccessResponse);
      expect(result1R.session).not.toEqual(result2R.session);
    });

    // Test for names with valid special characters
    test.each([
      ["Mary-Jane O'Connor", 'Smith'],
      ['John', "O'Neil-Smith"],
      ['Anne-Marie', 'Van Der Berg'],
      ["O'Connor", 'Smith-Jones']
    ])('Names with valid special characters work: %s %s', (firstName: string, lastName: string) => {
      const result = registerUser('test@example.com', 'Password123', firstName, lastName);
      expectSuccessAuthRegister(result);
    });
  });

  describe('Error Cases', () => {
    // Test for invalid email formats
    test.each([
      ['badexample.com', 'invalid format'],
      ['test @example.com', 'spaces in email'],
      ['testexample.com', 'no @ symbol'],
      ['', 'empty email'],
      ['invalid-email', 'invalid format'],
    ])('Invalid email format triggers INVALID_EMAIL: %s - %s',
      (email: string, description: string) => {
        const result = registerUser(email, 'Password123', 'John', 'Smith');
        expectErrorAuthRegister(result, 'INVALID_EMAIL');
      });

    // Test for invalid password formats
    test.each([
      ['OnlyLetters', 'no numbers'],
      ['12345678', 'only numbers'],
      ['Pass123', 'too short'],
      ['Password!@#', 'no numbers'],
      ['', 'empty password'],
      ['123', 'too short'],
    ])('Invalid password format triggers INVALID_PASSWORD: %s - %s',
      (password: string, description: string) => {
        const result = registerUser('test@example.com', password, 'John', 'Smith');
        expectErrorAuthRegister(result, 'INVALID_PASSWORD');
      });

    // Test for invalid first name formats
    test.each([
      ['John123', 'contains numbers'],
      ['John@', 'special characters'],
      ['a'.repeat(21), 'too long'],
      ['', 'empty'],
      ['J', 'too short'],
    ])('Invalid first name format triggers INVALID_FIRST_NAME: %s - %s',
      (firstName: string, description: string) => {
        const result = registerUser('test@example.com', 'Password123', firstName, 'Smith');
        expectErrorAuthRegister(result, 'INVALID_FIRST_NAME');
      });

    // Test for invalid last name formats
    test.each([
      ['Smith123', 'contains numbers'],
      ['a'.repeat(21), 'too long'],
      ['', 'empty'],
      ['D', 'too short'],
    ])('Invalid last name format triggers INVALID_LAST_NAME: %s - %s',
      (lastName: string, description: string) => {
        const result = registerUser('test@example.com', 'Password123', 'John', lastName);
        expectErrorAuthRegister(result, 'INVALID_LAST_NAME');
      });

    // Test for duplicate email registration
    test('Registering with duplicate email returns INVALID_EMAIL', () => {
      registerUser('duplicate@example.com', 'Password123', 'John', 'Smith');
      const result = registerUser('duplicate@example.com', 'Password123', 'Jane', 'Doe');
      expectErrorAuthRegister(result, 'INVALID_EMAIL');
    });
  });
});
