import {
  User,
  ErrorResponse,
  // ErrorTypes,
  EmptyObject
} from './interfaces';
import { getData } from './dataStore';
import validator from 'validator';
import {
  validateNewPassword,
  createErrorResponse,
  createSession,
  validateSession,
  removeSession,
  hashPassword,
  validateName
} from './helper_function';
// import { error } from 'console';

/**
 * Admin user registration
 * @param email - The email address of the user
 * @param password - The password for the user account
 * @param nameFirst - The first name of the user
 * @param nameLast - The last name of the user
 * @returns An object containing either the sessionId or an error response
 */
export function adminAuthRegister(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): { session: string } {
  // Check for valid email syntax
  if (!validator.isEmail(email)) {
    const error = new Error('Email format is invalid');
    error.name = 'INVALID_EMAIL';
    throw error;
  }

  // Check for duplicate email registration
  if (getData().users.some((user: User) => user.email === email)) {
    throw createErrorResponse('INVALID_EMAIL',
      'Email address is already in use');
  }

  // Check for minimum password length
  if (!validator.isLength(password, { min: 8 })) {
    throw createErrorResponse('INVALID_PASSWORD',
      'Password is less than 8 characters');
  }

  // Helper: check that password contains at least one letter and one number
  const hasLetter = [...password].some((char: string) =>
    (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
  );
  const hasNumber = [...password].some((char: string) =>
    char >= '0' && char <= '9'
  );

  if (!hasLetter || !hasNumber) {
    throw createErrorResponse('INVALID_PASSWORD',
      'Password must contain at least one letter and one number');
  }

  // First name validation
  validateName(nameFirst, 'FIRST');

  // Last name validation
  validateName(nameLast, 'LAST');

  // If all checks pass, user is created
  const store = getData();
  const userId = store.nextUserId;

  // Hash the password before storing
  const hashedPassword = hashPassword(password);

  const user: User = {
    userId,
    email,
    password: hashedPassword,
    nameFirst,
    nameLast,
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    passwordHistory: []
  };

  store.users.push(user);
  store.nextUserId++;

  // Create a session for the newly registered user
  const session = createSession(userId);

  return { session };
}

/**
 *
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {{session: string}} - object with sessionId.
 */
export function adminAuthLogin (email: string, password: string):
{session: string} | {error: string, message: string} {
  const data = getData();
  // this essentially looks through the array of users, whoss email matches the provided email.
  const user = data.users.find(u => u.email === email);

  // this checks for empty emails or passwords
  if (!email || !password) {
    throw createErrorResponse('INVALID_CREDENTIALS',
      'Email and password cannot be empty');
  }

  // this checks if the user exists
  if (!user) {
    throw createErrorResponse('INVALID_CREDENTIALS',
      'Email address does not exist');
  }

  // this checks if the password is correct
  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) {
    user.numFailedPasswordsSinceLastLogin++;
    throw createErrorResponse('INVALID_CREDENTIALS',
      'Password is not correct for the given email');
  }

  // this is for when the password entered is correct
  user.numSuccessfulLogins++;
  user.numFailedPasswordsSinceLastLogin = 0;

  const sessionId = createSession(user.userId);

  return {
    session: sessionId
  };
}

/**
 * Admin user details retrieval
 * @param sessionId - The session ID of the user whose details are to be retrieved
 * @returns An object containing user details or an error response
 */
export function adminUserDetails(sessionId: string):
{ user: {
  userId: number,
  name: string,
  email: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number }
} {
  // Validate session and get userId
  const userId = validateSession(sessionId);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  const data = getData();

  // Find the user with the userId
  const user = data.users.find((user: User) => user.userId === userId);

  // Return user details
  return {
    user: {
      userId: user.userId,
      name: `${user.nameFirst} ${user.nameLast}`,
      email: user.email,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 *
 * @param {number} sessionId - The sessionId of the user.
 * @param {string} oldPassword - The user's current password.
 * @param {string} newPassword - The new password to set.
 * @returns {{}} - An empty object.
 */
export function adminUserPasswordUpdate (sessionId: string,
  oldPassword: string, newPassword: string): EmptyObject | ErrorResponse {
  const userId = validateSession(sessionId);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  const data = getData();
  // finds the user with the given userId from the dataStore
  const user = data.users.find(u => u.userId === userId);

  // checks if old password is correct
  const hashedPasswordOld = hashPassword(oldPassword);
  if (user.password !== hashedPasswordOld) {
    throw createErrorResponse('INVALID_OLD_PASSWORD',
      'Old password is incorrect');
  }

  validateNewPassword(oldPassword, newPassword);

  // initialise password history if it doesn't exist
  // if (!user.passwordHistory) {
  //   user.passwordHistory = [];
  // }

  // checking if the new password has ever been used before
  const hashedPasswordNew = hashPassword(newPassword);
  if (user.passwordHistory.includes(hashedPasswordNew)) {
    throw createErrorResponse('INVALID_NEW_PASSWORD',
      'New password has already been used before');
  }

  // add the current password to history before updating the password and then update the password
  user.passwordHistory.push(user.password);
  user.password = hashedPasswordNew;

  return {};
}

/**
 * Given the data entered, each data field corresponding to it will be updated
 * @param {string} session - The session ID of the user
 * @param {string} email
 * @param {string} nameFirst
 * @param {string} nameLast
 * @returns {{}}  empty object
 */
export function adminUserDetailsUpdate(session: string,
  email: string, nameFirst: string, nameLast: string): EmptyObject | ErrorResponse {
  // Validate session and get userId
  const userId = validateSession(session);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  const data = getData();
  const users = data.users;

  if (users.find((user) => user.userId !== userId && user.email === email)) {
    throw createErrorResponse('INVALID_EMAIL', 'Email is currently used by another user.');
  }

  // check if email is valid
  if (validator.isEmail(email) === false) {
    throw createErrorResponse('INVALID_EMAIL', 'Email does not satisfy isEmail');
  }

  // check if first name contains invalid characters
  if (/[^a-zA-Z\s'-]/.test(nameFirst) === true) {
    throw createErrorResponse('INVALID_FIRST_NAME',
      'NameFirst has characters other than lowercase and uppercase letters, spaces, - , or \'');
  }

  validateName(nameFirst, 'FIRST');
  validateName(nameLast, 'LAST');

  // check if last name contains invalid characters
  if (/[^a-zA-Z\s'-]/.test(nameLast) === true) {
    throw createErrorResponse('INVALID_LAST_NAME',
      'NameLast contains characters other than lowercase and uppercase letters, spaces, - , or \'');
  }

  if (nameLast.length < 2 || nameLast.length > 20) {
    throw createErrorResponse('INVALID_LAST_NAME',
      'NameLast is less than 2 characters or more than 20 characters.');
  }

  // find the user and update it
  const updateUser = users.find((user) => user.userId === userId);
  updateUser.email = email;
  updateUser.nameFirst = nameFirst;
  updateUser.nameLast = nameLast;

  // return value
  return {};
}

/**
 * Logs out a user by invalidating their session
 * @param sessionId
 * @returns { }
 */
export function adminAuthLogout(sessionId: string):
EmptyObject {
  if (!sessionId || sessionId.trim() === '') {
    throw createErrorResponse('UNAUTHORISED',
      'Session is empty');
  }

  const userId = validateSession(sessionId);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED',
      'Session is empty or invalid');
  }

  removeSession(sessionId);

  return {};
}
