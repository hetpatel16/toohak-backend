import {
  RegisterSuccessResponse,
  QuizCreateSuccessResponse,
  ErrorResponse,
} from '../../src_ts/interfaces';
import {
  registerUser,
  createQuiz,
  clearData,
  expectSuccessQuizCreate,
  expectErrorQuizCreate
} from './../test_helper_functions';

describe('adminQuizCreate', () => {
  let userProfile: RegisterSuccessResponse;

  // Clears memory before each test
  beforeEach(() => {
    clearData();
    userProfile = (registerUser('test@example.com', 'Password123', 'John', 'Doe') as
      RegisterSuccessResponse);
  });

  describe('Success cases', () => {
    // Tests for 1 valid quiz created
    test('Create quiz with valid details returns quizId', () => {
      const result = createQuiz(userProfile.session, 'SampleQuiz', 'Its a sample quiz');

      expectSuccessQuizCreate(result as QuizCreateSuccessResponse);
      expect((result as QuizCreateSuccessResponse).quizId).toBeGreaterThan(0);
    });

    // Creates multiple quizzes from a single user
    test('Create multiple quizzes for same user', () => {
      const quiz1 = createQuiz(userProfile.session, 'Quiz 1', 'First quiz');
      const quiz2 = createQuiz(userProfile.session, 'Quiz 2', 'Second quiz');

      // Also checks if quiz2 id is > quiz1 id
      expectSuccessQuizCreate(quiz1 as QuizCreateSuccessResponse);
      expectSuccessQuizCreate(quiz2 as QuizCreateSuccessResponse);
      expect((quiz2 as QuizCreateSuccessResponse).quizId)
        .toBeGreaterThan((quiz1 as QuizCreateSuccessResponse).quizId);
    });

    // Tests valid names
    describe('Valid quiz names', () => {
      test('Minimum length name (3 characters)', () => {
        const result = createQuiz(userProfile.session, 'ABC', 'Minimum length name');
        expectSuccessQuizCreate(result as QuizCreateSuccessResponse);
      });

      test('Long name within limit', () => {
        const result =
          createQuiz(userProfile.session, 'A very long quiz name here', 'Long name within limit');
        expectSuccessQuizCreate(result as QuizCreateSuccessResponse);
      });

      test('Name with numbers', () => {
        const result = createQuiz(userProfile.session, 'Quiz 123', 'Name with numbers');
        expectSuccessQuizCreate(result as QuizCreateSuccessResponse);
      });

      test('Name with multiple spaces', () => {
        const result =
          createQuiz(userProfile.session, 'My Quiz With Spaces', 'Name with multiple spaces');
        expectSuccessQuizCreate(result as QuizCreateSuccessResponse);
      });
    });

    // Tests for empty description case
    test('Empty description case', () => {
      const result = createQuiz(userProfile.session, 'SampleQuiz', '');

      expectSuccessQuizCreate(result as QuizCreateSuccessResponse);
    });

    // Tests the maximum length of the description
    test('Maximum 100 characters for description', () => {
      const result = createQuiz(userProfile.session, 'SampleQuiz', 'a'.repeat(100));

      expectSuccessQuizCreate(result as QuizCreateSuccessResponse);
    });
  });

  describe('Error Cases', () => {
    // Tests for invalid sessionId cases
    describe('Invalid session IDs', () => {
      test('Non-existent session ID returns UNAUTHORISED', () => {
        const result = createQuiz('invalid-session-id', 'SampleQuiz', 'Valid description');
        expectErrorQuizCreate(result as ErrorResponse, 'UNAUTHORISED');
      });

      test('Empty session ID returns UNAUTHORISED', () => {
        const result = createQuiz('', 'SampleQuiz', 'Valid description');
        expectErrorQuizCreate(result as ErrorResponse, 'UNAUTHORISED');
      });
    });

    // Tests for invalid quiz names
    describe('Invalid quiz names - length issues', () => {
      test('Quiz name too short (2 characters)', () => {
        const result = createQuiz(userProfile.session, 'AB', 'Valid description');
        expectErrorQuizCreate(result as ErrorResponse, 'INVALID_QUIZ_NAME');
      });

      test('Quiz name too short (1 character)', () => {
        const result = createQuiz(userProfile.session, 'A', 'Valid description');
        expectErrorQuizCreate(result as ErrorResponse, 'INVALID_QUIZ_NAME');
      });

      test('Quiz name empty', () => {
        const result = createQuiz(userProfile.session, '', 'Valid description');
        expectErrorQuizCreate(result as ErrorResponse, 'INVALID_QUIZ_NAME');
      });

      test('Quiz name too long (31 characters)', () => {
        const result = createQuiz(userProfile.session, 'A'.repeat(31), 'Valid description');
        expectErrorQuizCreate(result as ErrorResponse, 'INVALID_QUIZ_NAME');
      });
    });

    describe('Invalid quiz names - special characters', () => {
      test.each([
        ['exclamation mark', 'Quiz!test'],
        ['at symbol', 'Quiz@test'],
        ['hyphen', 'Quiz-test'],
        ['underscore', 'Quiz_test'],
        ['period', 'Quiz.test'],
        ['hash symbol', 'Quiz#test'],
        ['ampersand', 'Quiz&test'],
        ['forward slash', 'Quiz/Test'],
        ['backslash', '\\QuizTest\\'],
        ['asterisk', 'Quiz*test']
      ])('Quiz name with %s returns INVALID_QUIZ_NAME', (description, invalidName) => {
        const result = createQuiz(userProfile.session, invalidName, 'Valid description');
        expectErrorQuizCreate(result as ErrorResponse, 'INVALID_QUIZ_NAME');
      });
    });

    // Tests for duplicate quiz names
    test('Duplicate quiz name for same user returns error', () => {
      // Create first quiz
      const result1 = createQuiz(userProfile.session, 'My Quiz', 'First quiz');
      expectSuccessQuizCreate(result1 as QuizCreateSuccessResponse);

      // Try to create second quiz with same name
      const result2 = createQuiz(userProfile.session, 'My Quiz', 'Second quiz');
      expectErrorQuizCreate(result2 as ErrorResponse, 'DUPLICATE_QUIZ_NAME');
    });

    // Tests for invalid descriptions
    describe('Invalid descriptions', () => {
      test('Quiz description too long (101 characters)', () => {
        const result = createQuiz(userProfile.session, 'Valid Quiz', 'A'.repeat(101));
        expectErrorQuizCreate(result as ErrorResponse, 'INVALID_DESCRIPTION');
      });
    });
  });

  describe('Side Effect Cases', () => {
    // Users creating quizzes at the same time
    test('Creating quiz does not affect other users', () => {
      const user1 = (registerUser('user1@example.com', 'Password123', 'John', 'Doe') as
        RegisterSuccessResponse);
      const user2 = (registerUser('user2@example.com', 'Password123', 'Jane', 'Smith') as
        RegisterSuccessResponse);

      const quiz1 = createQuiz(user1.session, 'User 1 Quiz', 'First user quiz');
      const quiz2 = createQuiz(user2.session, 'User 2 Quiz', 'Second user quiz');

      expectSuccessQuizCreate(quiz1 as QuizCreateSuccessResponse);
      expectSuccessQuizCreate(quiz2 as QuizCreateSuccessResponse);
      expect((quiz1 as QuizCreateSuccessResponse).quizId)
        .not.toBe((quiz2 as QuizCreateSuccessResponse).quizId);
    });

    // QuizId's change
    test('Quiz IDs are unique and incrementing', () => {
      const quiz1 = createQuiz(userProfile.session, 'Quiz 1', 'First quiz');
      const quiz2 = createQuiz(userProfile.session, 'Quiz 2', 'Second quiz');
      const quiz3 = createQuiz(userProfile.session, 'Quiz 3', 'Third quiz');

      expectSuccessQuizCreate(quiz1 as QuizCreateSuccessResponse);
      expectSuccessQuizCreate(quiz2 as QuizCreateSuccessResponse);
      expectSuccessQuizCreate(quiz3 as QuizCreateSuccessResponse);

      expect((quiz2 as QuizCreateSuccessResponse).quizId)
        .toBeGreaterThan((quiz1 as QuizCreateSuccessResponse).quizId);
      expect((quiz3 as QuizCreateSuccessResponse).quizId)
        .toBeGreaterThan((quiz2 as QuizCreateSuccessResponse).quizId);
    });
  });
});
