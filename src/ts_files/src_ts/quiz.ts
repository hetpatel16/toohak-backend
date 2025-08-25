import { downtimer } from 'downtimer';
import { getData } from './dataStore';
import {
  // User,
  Quiz,
  ErrorResponse,
  Question,
  Answer,
  QuizInfoReturn,
  EmptyObject,
  QuizListReturn,
  QuestionCreateReturn,
  QuizInfoSuccessResponse,
  Game,
  GameStartSuccessResponse,
  GameState,
  GameStatusCreateReturn,
  Action,
  actionData,
  QuestionResult,
  UsersRankedByScore,
  MIN_QUESTION_LENGTH, MAX_QUESTION_LENGTH,
  MIN_POINTS, MAX_POINTS,
  MIN_ANSWERS_LENGTH, MAX_ANSWERS_LENGTH,
  MAX_TIMELIMIT, MIN_TIMELIMIT,
  MAX_AUTO_START_NUM,
  MAX_ACTIVE_GAMES,
  MIN_QUESTIONS
} from './interfaces';
import {
  createErrorResponse,
  validateSession,
  invalidQuiz,
  generateColour,
  updateNextQuestion,
  COUNT_DOWN,
} from './helper_function';

const MAX_NAME_LENGTH = 30;
const MIN_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 100;
export const timers = downtimer();
/**
 * Given basic details about a new quiz, create one for the logged in user.
 *
 * @param {string} sessionId - The session ID of the user creating the quiz
 * @param {string} name - The name of the quiz
 * @param {string} description - The description of the quiz
 * @returns {object} - Returns {quizId} on success or {error, message} on failure
 */
export function adminQuizCreate(
  sessionId: string,
  name: string,
  description: string
): { quizId: number } | { error: string, message: string } {
  // Validate session and get userId
  const userId = validateSession(sessionId);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  const data = getData();

  // Check name length
  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    throw createErrorResponse('INVALID_QUIZ_NAME',
      'Name must be between 3 and 30 characters long');
  }

  // Check for valid characters
  const validNameRegex = /^[a-zA-Z0-9 ]+$/;
  if (!validNameRegex.test(name)) {
    throw createErrorResponse('INVALID_QUIZ_NAME',
      'Name contains invalid characters.');
  }

  // Check for duplicate quiz name
  const userQuizzes = data.quizzes.filter((quiz: Quiz) => quiz.userId === userId);
  const duplicateQuiz = userQuizzes.find((quiz: Quiz) => quiz.name === name);
  if (duplicateQuiz) {
    throw createErrorResponse('DUPLICATE_QUIZ_NAME',
      'Name is already used by the current logged in user for another quiz');
  }

  // Validate description
  // if (typeof description !== 'string') {
  //   throw new Error('INVALID_DESCRIPTION: Description must be a string');
  // }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw createErrorResponse('INVALID_DESCRIPTION',
      'Description is more than 100 characters in length');
  }

  // Generate new quiz ID
  const quizId = data.nextQuizId;
  data.nextQuizId++;

  // Create new quiz
  const newQuiz: Quiz = {
    quizId,
    userId,
    name,
    description,
    timeCreated: Math.floor(Date.now() / 1000),
    timeLastEdited: Math.floor(Date.now() / 1000),
    questions: [],
    timeLimit: 0,
    thumbnailUrl: ''
  };
  // Add quiz to data
  data.quizzes.push(newQuiz);

  return { quizId };
}

/**
 * Given a particular quiz, permanently remove the quiz.
 *
 * @param {string} sessionId - The sessionId of the user.
 * @param {number} quizId - Unique identifier assigned to each quiz.
 *
 * @returns {{}} - Returns an empty object  after deletion.
 */
export function adminQuizRemove (sessionId: string, quizId: number): EmptyObject | ErrorResponse {
  const data = getData();
  const quizzes = data.quizzes;

  // Check error cases:

  // UNAUTHORISED
  // Uses a helper function to validate the sessionId
  const userId = validateSession(sessionId);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  // INVALID_QUIZ_ID:
  // Helper function used to check if quizId exists.
  if (invalidQuiz(quizzes, quizId)) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  // ACTIVE_GAME_EXISTS:
  const games = data.games;
  if (games.find((game) => game.quizId === quizId && game.state !== 'END')) {
    throw createErrorResponse('ACTIVE_GAME_EXISTS',
      'Quiz Cannot be romved, an active game exists');
  }

  // Success case :
  // Remove the quiz after passing all tests.
  const quizIndex = quizzes.findIndex(
    (quiz) => quiz.quizId === quizId && quiz.userId === userId
  );
  quizzes.splice(quizIndex, 1);

  return {};
}

/**
 * Update the name of the relevant quiz.
 *
 * @param {string} sessionId - The sessionId of the user.
 * @param {number} quizId - Unique identifier assigned to each quiz.
 * @param {string} name - The new name assign to the quiz.
 *
 * @returns {{}} - Returns an empty object after the update.
 */
export function adminQuizNameUpdate (sessionId: string,
  quizId: number, name: string): EmptyObject | ErrorResponse {
  const data = getData();
  const quizzes = data.quizzes;

  // Check error cases:

  // UNAUTHORISED
  // Uses a helper function to validate the sessionId
  const userId = validateSession(sessionId);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  // INVALID_QUIZ_ID:
  // Helper function used to check if quizId exists.
  if (invalidQuiz(quizzes, quizId)) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  // INVALID_QUIZ_NAME
  // Check for invalid characters in the new name
  if (!(/^[a-zA-Z0-9 ]+$/.test(name))) {
    throw createErrorResponse('INVALID_QUIZ_NAME',
      'Name contains invalid characters.');
  }

  // Check for the new name length constraints (between 3 and 30).
  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    throw createErrorResponse('INVALID_QUIZ_NAME',
      'Name must be between 3 and 30 characters long');
  }

  // DUPLICATE_QUIZ_NAME
  if (quizzes.some((quiz) => quiz.name === name && quiz.userId === userId)) {
    throw createErrorResponse('DUPLICATE_QUIZ_NAME',
      'Name is already used by the current logged in user for another quiz');
  }

  // Update name after passing all tests.
  const quizIndex = quizzes.findIndex((quiz) => quiz.quizId === quizId && quiz.userId === userId);
  quizzes[quizIndex].name = name;
  return {};
}

/**
 * Update the description of the relevant quiz
 *
 * @param {string} sessionId - The sessionId of the user.
 * @param {number} quizId - Unique identifier assigned to each quiz.
 * @param {string} description - The new description to assign to the quiz.
 *
 * @returns {{}} - Returns an empty object after the update.
 */
export function adminQuizDescriptionUpdate (sessionId: string,
  quizId:number, description:string): EmptyObject | ErrorResponse {
  const data = getData();
  const quizzes = data.quizzes;

  const userId = validateSession(sessionId);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  // INVALID_QUIZ_ID:
  // Helper function used to check if quizId exists.
  if (invalidQuiz(quizzes, quizId)) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  // INVALID_DESCRIPTION:
  // Check for the new description length constraints (must be less than 100 character).
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw createErrorResponse('INVALID_DESCRIPTION',
      'Description is more than 100 characters in length');
  }

  // Update description after passing all tests.
  const quizIndex = quizzes.findIndex((quiz) => quiz.quizId === quizId && quiz.userId === userId);
  quizzes[quizIndex].description = description;
  return {};
}

/**
 *  Returns a list of all the quizzes that are owned by userId
 * @param {string} session
 * @returns { quizzes: [{ quizId,name} ]} - list of test objects
 */
export function adminQuizList (session:string): QuizListReturn {
  const data = getData();
  const users = data.users;
  const quizzes = data.quizzes;

  const quizList = [];
  const userId = validateSession(session);
  // error cases
  if (users.find((user) => user.userId === userId) === undefined) {
    throw createErrorResponse('UNAUTHORISED', 'userId is not a valid user.');
  }

  for (let i = 0; i < quizzes.length; i++) {
  // loop through quizzes list, if ownerID & userId are a match, the quiz is added to the quiz_list
    if (quizzes[i].userId === userId) {
      quizList.unshift({
        quizId: quizzes[i].quizId,
        name: quizzes[i].name
      });
    }
  }
  return { quizzes: quizList };
}

/**
 * Returns the information about the current test
 * @param {string} session
 * @param {number} quizId
 * @returns {quizId, name, timeCreated, timeLastEdited, description} - QuizObj
 */
export function adminQuizInfo (session:string, quizId:number): QuizInfoReturn {
  const data = getData();

  const users = data.users;
  const quizzes = data.quizzes;
  const userId = validateSession(session);

  // error cases
  if (users.find((user) => user.userId === userId) === undefined) {
    throw createErrorResponse('UNAUTHORISED', 'Quiz ID does not refer to a valid quiz.');
  }

  if (quizzes.find((quiz) => quiz.quizId === quizId && quiz.userId === userId) === undefined) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a quiz that this user owns.'
    );
  }
  // finds the exact quiz
  const quizIndex = quizzes.findIndex((quiz) => quiz.quizId === quizId && quiz.userId === userId);
  const quiz = quizzes[quizIndex];

  const quizInfo = {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    questions: quiz.questions.map(q => ({
      questionId: q.questionId,
      question: q.question,
      timeLimit: q.timeLimit,
      points: q.points,
      answerOptions: q.answerOptions,
      thumbnailUrl: q.thumbnailUrl
    })),
    timeLimit: quiz.timeLimit,
    thumbnailUrl: quiz.thumbnailUrl
  };
  return quizInfo;
}

/**
 * Delete a particular question from a quiz
 *
 * @param {string} sessionId - The session ID of the user deleting the question
 * @param {number} quizId - The ID of the quiz containing the question
 * @param {number} questionId - The ID of the question to delete
 * @returns {object} - Returns {} on success or {error, message} on failure
 */
export function adminQuestionDelete(
  sessionId: string,
  quizId: number,
  questionId: number
): EmptyObject {
  // Get userId
  const userId = validateSession(sessionId);
  const data = getData();
  const games = data.games;

  // Check if user has logged into a valid session with a userId
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  // Check if quizId is a valid number
  if (typeof quizId !== 'number' || quizId <= 0 || !Number.isInteger(quizId)) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  // Find the quiz
  const quiz = data.quizzes.find((quiz: Quiz) => quiz.quizId === quizId);
  if (!quiz) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  // Check if user is the owner of this quiz
  if (quiz.userId !== userId) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'User is not an owner of this quiz');
  }

  // Find the question within the quiz
  const questionIndex =
  quiz.questions.findIndex((question: Question) => question.questionId === questionId);
  if (questionIndex === -1) {
    throw createErrorResponse('INVALID_QUESTION_ID',
      'Question Id does not refer to a valid question this quiz');
  }

  // Check if any game for this quiz is not in END state
  const activeGame = games.find((game: Game) =>
    game.quizId === quizId && game.state !== 'END'
  );
  if (activeGame) {
    throw createErrorResponse('ACTIVE_GAME_EXISTS',
      'Any game for this quiz is not in END state');
  }

  // Delete the question from the quiz
  quiz.questions.splice(questionIndex, 1);

  // Update the quiz's last edited time
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);

  return {};
}

/**
 *
 * Update the thumbnail of the relevant quiz
 * @param sessionId
 * @param quizId
 * @param thumbnailUrl
 *
 * @returns {{}} - Returns an empty object after the update.
 *
 */
export function adminQuizThumbnail(sessionId:string,
  quizId:number,
  thumbnailUrl: string): EmptyObject | ErrorResponse {
  const data = getData();
  const quizzes = data.quizzes;
  let error: Error;

  // Check error cases:
  // UNAUTHORISED
  // Uses a helper function to validate the sessionId
  const userId = validateSession(sessionId);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  // INVALID_QUIZ_ID:
  // Helper function used to check if quizId exists.
  if (invalidQuiz(quizzes, quizId)) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  const start = thumbnailUrl.toLowerCase().startsWith('http://') ||
  thumbnailUrl.toLowerCase().startsWith('https://');
  const end = thumbnailUrl.toLowerCase().endsWith('.jpg') ||
  thumbnailUrl.toLowerCase().endsWith('.jpeg') ||
  thumbnailUrl.toLowerCase().endsWith('.png');

  if (!start) {
    throw createErrorResponse('INVALID_THUMBNAIL',
      'The thumbnailUrl does not begin with \'http://\' or \'https://\'');
  }

  if (!end) {
    error = new Error('The thumbnailUrl does not end with: jpg, jpeg, png');
    error.name = 'INVALID_THUMBNAIL';
    throw createErrorResponse('INVALID_THUMBNAIL',
      'The thumbnailUrl does not end with: jpg, jpeg, png');
  }

  // Update thumbnail after passing all tests.
  const quizIndex = quizzes.findIndex((quiz) => quiz.quizId === quizId && quiz.userId === userId);
  quizzes[quizIndex].thumbnailUrl = thumbnailUrl;
  quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);
  return {};
}

/**
 *
 * @param quizId - number
 * @param session - string
 * @param question - string
 * @param timeLimit - number
 * @param points - number
 * @param answers - Answer[]
 * @param thumbnailUrl - string
 * @returns {questionId}
 */
export function adminQuizQuestionCreate(quizId: number,
  session: string,
  question: string,
  timeLimit: number,
  points: number,
  answers:
      {
      answer: string,
      correct: boolean,
      }[],
  thumbnailUrl: string
) : QuestionCreateReturn {
  const data = getData();
  const users = data.users;
  const quizzes = data.quizzes;

  const userId = validateSession(session);

  if (users.find((user) => user.userId === userId) === undefined) {
    throw createErrorResponse('UNAUTHORISED',
      'Quiz ID does not refer to a valid quiz.');
  }
  const quiz = quizzes.find((quiz_) => quiz_.quizId === quizId && quiz_.userId === userId);

  if (question.length < MIN_QUESTION_LENGTH || question.length > MAX_QUESTION_LENGTH) {
    throw createErrorResponse('INVALID_QUESTION',
      'The points awarded for the question are less than 1 or greater than 10');
  }

  if (points < MIN_POINTS || points > MAX_POINTS) {
    throw createErrorResponse('INVALID_QUESTION',
      'The points awarded for the question are less than 1 or greater than 10');
  }

  if (answers.length < MIN_ANSWERS_LENGTH || answers.length > MAX_ANSWERS_LENGTH) {
    throw createErrorResponse(
      'INVALID_ANSWERS',
      'The question has more than 6 answers or less than 2 answers'
    );
  }

  // check every answer choice is not short
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i].answer;
    if (answer.length < 1 || answer.length > 30) {
      throw createErrorResponse(
        'INVALID_ANSWERS',
        'The length of any answer is shorter than 1 character long, or longer than 30'
      );
    }
  }

  // check there are no duplicates
  let j = 0;
  while (j < answers.length) {
    for (let i = 0; i < answers.length; i++) {
      const compareAns = answers[j].answer;
      const answer = answers[i].answer;
      if (compareAns.localeCompare(answer) === 0 && i !== j) {
        throw createErrorResponse(
          'INVALID_ANSWERS',
          'Any answer strings are duplicates of one another'
        );
      }
    }
    j++;
  }

  // check all are not false
  let countF = 0;
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i].correct;
    if (answer === false) {
      countF++;
    }
  }
  if (countF === answers.length) {
    throw createErrorResponse('INVALID_ANSWERS', 'There are no correct answers');
  }

  if (timeLimit <= MIN_TIMELIMIT) {
    throw createErrorResponse(
      'INVALID_TIMELIMIT',
      'The question timeLimit is not a positive number'
    );
  }

  const start = thumbnailUrl.toLowerCase().startsWith('http://') ||
  thumbnailUrl.toLowerCase().startsWith('https://');
  const end = thumbnailUrl.toLowerCase().endsWith('.jpg') ||
  thumbnailUrl.toLowerCase().endsWith('.jpeg') ||
  thumbnailUrl.toLowerCase().endsWith('.png');

  if (!start) {
    throw createErrorResponse('INVALID_THUMBNAIL',
      'The thumbnailUrl does not begin with \'http://\' or \'https://\'');
  }

  if (!end) {
    throw createErrorResponse('INVALID_THUMBNAIL',
      'The thumbnailUrl does not end with: jpg, jpeg, png');
  }

  // add question to quiz

  if (!quiz) {
    throw createErrorResponse(
      'INVALID_QUIZ_ID',
      'Quiz does not exist or does not belong to the user'
    );
  }
  const questionId: number = Math.max(0, ...quiz.questions.map(q => q.questionId ?? 0)) + 1;

  const totalTime = quiz.questions.reduce((sum, q) => sum + q.timeLimit, 0) + timeLimit;
  if (totalTime > MAX_TIMELIMIT) {
    throw createErrorResponse(
      'INVALID_TIMELIMIT',
      'The sum of the question timeLimits in the quiz exceeds 3 minutes'
    );
  }

  quiz.timeLimit = totalTime;

  let nextAnswerId = 1;
  const answers_ = answers.map(opt => ({
    answerId: nextAnswerId++,
    answer: opt.answer,
    correct: opt.correct,
    colour: generateColour(),
  }));

  quiz.timeLastEdited = quiz.timeCreated;
  const newQuestion: Question = {
    questionId,
    question,
    timeLimit: timeLimit,
    points,
    answerOptions: answers_,
    thumbnailUrl: thumbnailUrl,
  };

  quiz.questions.push(newQuestion);
  return { questionId };
}
/**
 *
 * @param quizId - number
 * @param questionId - number
 * @param session - string
 * @param question - string
 * @param timeLimit - number
 * @param points - number
 * @param answerOptions - Answer []
 * @param thumbnailUrl - string
 * @returns {} - empty bracket
 */
export function adminQuizQuestionUpdate(quizId: number,
  questionId: number,
  session: string,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions :{
    answer: string,
    correct: boolean,
  }[],
  thumbnailUrl: string
): EmptyObject | ErrorResponse {
  const data = getData();
  const users = data.users;
  const quizzes = data.quizzes;

  const userId = validateSession(session);

  if (users.find((user) => user.userId === userId) === undefined) {
    throw createErrorResponse('UNAUTHORISED', 'user ID does not refer to a valid quiz.');
  }

  const quiz = quizzes.find((quiz_) => quiz_.quizId === quizId && quiz_.userId === userId);

  if (!quiz) {
    throw createErrorResponse(
      'INVALID_QUIZ_ID',
      'Quiz ID does not refer to a quiz that this user owns.'
    );
  }
  const question_ = quiz.questions.find(question1 => question1.questionId === questionId);
  if (!question_) {
    throw createErrorResponse(
      'INVALID_QUESTION_ID',
      'Question Id does not refer to a valid question within this quiz'
    );
  }

  if (question.length < MIN_QUESTION_LENGTH || question.length > MAX_QUESTION_LENGTH) {
    throw createErrorResponse(
      'INVALID_QUESTION',
      'Question string is less than 5 characters in length or greater than 50'
    );
  }

  if (points < MIN_POINTS || points > MAX_POINTS) {
    throw createErrorResponse(
      'INVALID_QUESTION',
      'The points awarded for the question are less than 1 or greater than 10'
    );
  }

  const answerList : Answer[] = [];
  for (let i = 0; i < answerOptions.length; i++) {
    answerList.push({
      answerId: i + 1,
      answer: answerOptions[i].answer,
      correct: answerOptions[i].correct,
      colour: generateColour()
    });
  }

  if (answerList.length < MIN_ANSWERS_LENGTH || answerList.length > MAX_ANSWERS_LENGTH) {
    throw createErrorResponse(
      'INVALID_ANSWERS',
      'The question has more than 6 answers or less than 2 answers'
    );
  }

  // check every answer choice is not short
  for (let i = 0; i < answerOptions.length; i++) {
    const answer = answerOptions[i].answer;
    if (answer.length < 1 || answer.length > 30) {
      throw createErrorResponse(
        'INVALID_ANSWERS',
        'The length of any answer is shorter than 1 character long, or longer than 30'
      );
    }
  }

  // check there are no duplicates
  let j = 0;
  while (j < answerOptions.length) {
    for (let i = 0; i < answerOptions.length; i++) {
      const compareAns = answerOptions[j].answer;
      const answer = answerOptions[i].answer;
      if (compareAns.localeCompare(answer) === 0 && i !== j) {
        throw createErrorResponse(
          'INVALID_ANSWERS',
          'Any answer strings are duplicates of one another'
        );
      }
    }
    j++;
  }

  // check all are not false
  let countF = 0;
  for (let i = 0; i < answerOptions.length; i++) {
    const answer = answerOptions[i].correct;
    if (answer === false) {
      countF++;
    }
  }
  if (countF === answerOptions.length) {
    throw createErrorResponse('INVALID_ANSWERS', 'There are no correct answers');
  }

  if (timeLimit <= MIN_TIMELIMIT) {
    throw createErrorResponse(
      'INVALID_TIMELIMIT',
      'The question timeLimit is not a positive number'
    );
  }

  const totalTime = quiz.questions.reduce((sum, q) => {
    return sum + (q.questionId === questionId ? timeLimit : q.timeLimit);
  }, 0);

  if (totalTime > MAX_TIMELIMIT) {
    throw createErrorResponse(
      'INVALID_TIMELIMIT',
      'The sum of the question timeLimits in the quiz exceeds 3 minutes'
    );
  }

  // If valid, update the quiz's total timeLimit
  quiz.timeLimit = totalTime;

  const start = thumbnailUrl.toLowerCase().startsWith('http://') ||
  thumbnailUrl.toLowerCase().startsWith('https://');
  const end = thumbnailUrl.toLowerCase().endsWith('.jpg') ||
  thumbnailUrl.toLowerCase().endsWith('.jpeg') ||
  thumbnailUrl.toLowerCase().endsWith('.png');

  if (!start) {
    throw createErrorResponse('INVALID_THUMBNAIL',
      'The thumbnailUrl does not begin with \'http://\' or \'https://\'');
  }

  if (!end) {
    throw createErrorResponse('INVALID_THUMBNAIL',
      'The thumbnailUrl does not end with: jpg, jpeg, png');
  }

  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  question_.question = question;
  question_.points = points;
  question_.timeLimit = timeLimit;
  question_.answerOptions = answerList;
  question_.thumbnailUrl = thumbnailUrl;

  return {};
}

// game features

/**
 *
 * @param {string} session
 * @param {number} quizId
 * @param {number} autoStartNum
 * @returns {GameStartSuccessResponse}
 */
export function adminQuizGameStart(
  session: string,
  quizId: number,
  autoStartNum: number): GameStartSuccessResponse {
  const data = getData();
  const quizzes = data.quizzes;
  const games = data.games;
  let error: Error;

  // Check error cases:

  // UNAUTHORISED
  // Uses a helper function to validate the sessionId
  const userId = validateSession(session);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  // INVALID_QUIZ_ID:
  // Helper function used to check if quizId exists.
  if (invalidQuiz(quizzes, quizId)) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  // check autoStartNum
  if (autoStartNum > MAX_AUTO_START_NUM) {
    throw createErrorResponse('INVALID_GAME',
      'autoStartNum is a number greater than 50');
  }

  // check active games
  const activeGames = adminQuizGameView(session, quizId).activeGames;
  if (activeGames.length >= MAX_ACTIVE_GAMES) {
    throw createErrorResponse('MAX_ACTIVATE_GAMES',
      'Cannot start a new' +
        'game: 10 games that are not in END state currently exist for this quiz');
  }

  const quizInfo = (adminQuizInfo(session, quizId) as QuizInfoSuccessResponse);
  if (quizInfo.questions.length <= MIN_QUESTIONS) {
    error = new Error('The quiz does not have any questions in it');
    error.name = 'QUIZ_IS_EMPTY';
    throw error;
  }

  const quiz = quizzes.find((quiz_) => quiz_.quizId === quizId && quiz_.userId === userId);

  // first coppy current quiz.
  const quizCpy = JSON.parse(JSON.stringify(quiz)); // deep copy

  const gameId = data.nextGameId;
  data.nextGameId++;

  // create new game:
  const game: Game = {
    quizId: quizCpy.quizId,
    gameId,
    state: GameState.LOBBY,
    autoStartNum: autoStartNum,
    players: [],
    atQuestion: 1
  };

  games.push(game);

  return { gameId };
}

/**
 *
 * @param session
 * @param quizid
 */
export function adminQuizGameView(session: string, quizid: number) {
  const data = getData();
  const quizzes = data.quizzes;
  const games = data.games;

  // error cases to be implemented
  const sessionId = validateSession(session);

  if (!sessionId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  if (quizzes.find((quiz) => quiz.quizId === quizid) === undefined) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'User is not an owner of this quiz, or quiz doesn\'t exist');
  }

  const activeGames: number[] = []; const inactiveGames: number[] = [];

  for (const g of games) {
    if (g.quizId === quizid) {
      if (g.state === 'END') {
        inactiveGames.push(g.gameId);
      } else {
        activeGames.push(g.gameId);
      }
    }
  }

  return {
    activeGames: activeGames.sort((a, b) => a - b),
    inactiveGames: inactiveGames.sort((a, b) => a - b)
  };
}

export function adminQuizGameStatus(
  session: string,
  quizid: number,
  gameid: number) : GameStatusCreateReturn {
  const data = getData();
  const quizzes = data.quizzes;
  const games = data.games;

  // error cases and throw
  const game = games.find((g) => g.gameId === gameid);

  if (games.find((g) => g.gameId === gameid) === undefined) {
    throw createErrorResponse('INVALID_GAME_ID',
      'Game Id does not refer to a valid game within this quiz');
  }

  const sessionId = validateSession(session);

  if (!sessionId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  if (quizzes.find((quiz) => quiz.quizId === quizid) === undefined) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'User is not an owner of this quiz, or quiz doesn\'t exist');
  }

  const names :string [] = [];
  for (const i in game.players) {
    names[i] = game.players[i].playerName;
  }

  const quizInfo = adminQuizInfo(session, quizid);
  // build your object
  const Obj = {
    state: game.state,
    atQuestion: game.atQuestion,
    players: names,
    metadata: quizInfo,
  };

  return Obj;
}

/**
 * Update game's state
 * @param {string} session
 * @param {number} quizId
 * @param {number} gameId
 * @param {string} action
 * @returns {}
 */
export function adminQuizGameUpdate(
  session: string,
  quizId: number,
  gameId: number,
  action: Action
): EmptyObject {
  const data = getData();
  const quizzes = data.quizzes;
  const games = data.games;
  const userId = validateSession(session);
  let error: Error;

  // Check error cases:
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  // INVALID_QUIZ_ID:
  // Helper function used to check if quizId exists.
  if (invalidQuiz(quizzes, quizId)) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  const game = games.find((game) => game.gameId === gameId && game.quizId === quizId);
  if (!game) {
    throw createErrorResponse('INVALID_GAME_ID',
      'Game Id does not refer to a valid game within this quiz');
  }

  // check valid action
  if (!(actionData.find((actionInArray) => actionInArray === action))) {
    error = new Error('Action provided is not a valid Action');
    error.name = 'INVALID_ACTION';
    throw createErrorResponse('INVALID_ACTION',
      'Action provided is not a valid Action');
  }

  const quizInfo = adminQuizInfo(session, quizId) as QuizInfoSuccessResponse;
  const totalQuestions = quizInfo.questions.length;

  const questionPosition = game.atQuestion - 1;
  const duration = quizInfo.questions[questionPosition].timeLimit;

  // LOBBY -> END or LOBB -> QUESTION_COUNTDOWN
  if (game.state === 'LOBBY') {
    if (action === 'NEXT_QUESTION') {
      game.state = 'QUESTION_COUNTDOWN';
      game.startCountDown = timers.schedule(() => {
        game.state = 'QUESTION_OPEN';
        game.startQuestionTimer = timers.schedule(() => {
          game.state = 'QUESTION_CLOSE';
        }, duration * 1000);
      }, COUNT_DOWN * 1000);
      return {};
    } else if (action === 'END') {
      game.state = 'END';
      return {};
    }
  }

  // QUESTOIN_COUNTDOWN -> END or QUESTION_COUNTDOWN -> QUESITON_OPEN
  if (game.state === 'QUESTION_COUNTDOWN') {
    if (action === 'SKIP_COUNTDOWN') {
      timers.clear(game.startCountDown);
      game.state = 'QUESTION_OPEN';
      game.startQuestionTimer = timers.schedule(() => {
        game.state = 'QUESTION_CLOSE';
      }, duration * 1000);
      return {};
    } else if (action === 'END') {
      timers.clear(game.startCountDown);
      game.state = 'END';
      return {};
    }
  }

  // QUESTION_OPEN -> END or QUESTION_OPEN -> ANSWER_SHOW
  //  or QUESTION_OPEN -> QUESTION_CLOSE
  if (game.state === 'QUESTION_OPEN') {
    if (action === 'GO_TO_ANSWER') {
      timers.clear(game.startQuestionTimer);
      game.state = 'ANSWER_SHOW';
      return {};
    } else if (action === 'END') {
      timers.clear(game.startQuestionTimer);
      game.state = 'END';
      return {};
    }
  }

  // QUESTION_CLOSE -> END or QUESITON_CLOSE -> FINAL_RESULTS
  // or QUESTION_CLOSE -> QUESTION_COUNTDOWN
  if (game.state === 'QUESTION_CLOSE') {
    if (action === 'GO_TO_ANSWER') {
      game.state = 'ANSWER_SHOW';
      return {};
    } else if (action === 'GO_TO_FINAL_RESULTS') {
      game.state = 'FINAL_RESULTS';
      return {};
    } else if (action === 'NEXT_QUESTION') {
      // update to QUESTION_COUNT
      // or FINAL_RESULTS if current question is last question
      updateNextQuestion(game, timers, totalQuestions, duration);
      return {};
    } else if (action === 'END') {
      game.state = 'END';
      return {};
    }
  }

  // ANSWER_SHOW -> QUESTION_COUNTDOWN or ANSWER_SHOW -> END
  // or ANSWER_SHOW -> FINAL_RESULTS
  if (game.state === 'ANSWER_SHOW') {
    if (action === 'NEXT_QUESTION') {
      // update to QUESTION_COUNT
      // or FINAL_RESULTS if current question is last question
      updateNextQuestion(game, timers, totalQuestions, duration);
      return {};
    } else if (action === 'GO_TO_FINAL_RESULTS') {
      game.state = 'FINAL_RESULTS';
      return {};
    } else if (action === 'END') {
      game.state = 'END';
      return {};
    }
  }

  // FINAL_RESULTS -> END
  if (game.state === 'FINAL_RESULTS') {
    if (action === 'END') {
      game.state = 'END';
      return {};
    }
  }
  throw createErrorResponse('INCOMPATIBLE_GAME_STATE',
    'Action enum cannot be applied in the current state');
}

export function adminQuizGameResult(session: string, quizId: number, gameId: number) {
  const data = getData();
  const quizzes = data.quizzes;
  const quiz = quizzes.find((q) => q.quizId === quizId);
  const games = data.games;
  let error: Error;

  // Check error cases:
  // UNAUTHORISED
  // Uses a helper function to validate the sessionId
  const userId = validateSession(session);
  if (!userId) {
    throw createErrorResponse('UNAUTHORISED', 'Invalid session');
  }

  // INVALID_QUIZ_ID:
  // Helper function used to check if quizId exists.
  if (invalidQuiz(quizzes, quizId)) {
    throw createErrorResponse('INVALID_QUIZ_ID',
      'Quiz ID does not refer to a valid quiz.');
  }

  const game = games.find((game) => game.gameId === gameId && game.quizId === quizId);
  if (!game) {
    throw createErrorResponse('INVALID_GAME_ID',
      'Game Id does not refer to a valid game within this quiz');
  }

  if (game.state !== GameState.FINAL_RESULTS) {
    error = new Error('Game is not in FINAL_RESULTS state');
    error.name = 'INCOMPATIBLE_GAME_STATE';
    throw createErrorResponse('INCOMPATIBLE_GAME_STATE',
      'Game is not in FINAL_RESULTS state');
  }
  const players = game.players;
  const questions = quiz.questions;
  const usersRankedByScore: UsersRankedByScore[] = [];
  const questionResults: QuestionResult[] = [];

  for (const question of questions) {
    const index = questions.indexOf(question);
    // const question = questions[index];
    const questionPosition = index + 1;
    const correctAnswerIds = question.answerOptions
      .filter(opt => opt.correct)
      .map(opt => opt.answerId);

    const questionAnswers = data.playerAnswers.filter(
      (ans) => ans.questionPosition === questionPosition &&
             players.some(p => p.playerId === ans.playerId)
    );

    const playersCorrect: string[] = [];
    const answerTimes: number[] = [];

    for (const answer of questionAnswers) {
      const player = players.find(p => p.playerId === answer.playerId);

      const hasAllCorrect = correctAnswerIds.every(id => answer.answerIds.includes(id));
      const hasNoIncorrect = answer.answerIds.every(id => correctAnswerIds.includes(id));

      if (hasAllCorrect && hasNoIncorrect && answer.answerIds.length === correctAnswerIds.length) {
        playersCorrect.push(player.playerName);
      }

      answerTimes.push((Date.now() - answer.submittedAt) / 1000);
    }

    const averageAnswerTime = answerTimes.length > 0
      ? parseFloat((answerTimes.reduce((a, b) => a + b) / answerTimes.length).toFixed(2))
      : 0;

    const percentCorrect = questionAnswers.length > 0
      ? parseFloat(((playersCorrect.length / questionAnswers.length) * 100).toFixed(2))
      : 0;

    questionResults.push({
      questionId: question.questionId,
      playersCorrect,
      averageAnswerTime: averageAnswerTime,
      percentCorrect,
    });
  }

  for (const player of players) {
    let score = 0;
    for (const question of questions) {
      const index = questions.indexOf(question);
      const result = questionResults[index];
      if (result.playersCorrect.includes(player.playerName)) {
        score += questions[index].points;
      }
    }
    usersRankedByScore.push({
      playerName: player.playerName,
      score,
    });
  }

  usersRankedByScore.sort((a, b) => b.score - a.score);

  return {
    usersRankedByScore,
    questionResults
  };
}
