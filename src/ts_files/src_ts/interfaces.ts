// types/interfaces.ts

import { TimerId } from 'downtimer';

// Main data model interfaces
export interface User {
  userId: number;
  email: string;
  password: string;
  passwordHistory?: string[];
  nameFirst: string;
  nameLast: string;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
}

export interface Sessions {
  session: string;
  userId: number;
  createdAt: number;
}

export interface Quiz {
  quizId: number;
  userId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  questions: Question[];
  timeLimit?: number;
  thumbnailUrl?: string;
}

export interface Question {
  questionId: number;
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: Answer[];
  thumbnailUrl: string;
}

export interface Answer {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface Game {
  quizId: number;
  gameId: number;
  state: string;
  autoStartNum: number;
  players: Player[];
  atQuestion: number;
  startCountDown?: TimerId;
  startQuestionTimer?: TimerId;
}

export interface DataStore {
  users: User[];
  quizzes: Quiz[];
  sessions: Sessions[];
  games: Game[];
  playerAnswers: PlayerAnswer[];
  nextUserId: number;
  nextQuizId: number;
  nextGameId: number;
  nextPlayerId: number;
}

export interface Player {
  playerId: number;
  playerName: string;
  gameId: number;
  joinedAt: number;
}

export enum GameState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}

export interface PlayerAnswer {
  playerId: number;
  questionPosition: number;
  answerIds: number[];
  submittedAt: number;
}

export interface PlayerJoinSuccessResponse {
  playerId: number;
}

export interface PlayerStatusSuccessResponse {
  state: string;
  numQuestions: number;
  atQuestion: number;
}

export interface PlayerQuestionInfoSuccessResponse {
  questionId: number;
  question: string;
  timeLimit: number;
  thumbnailUrl: string;
  points: number;
  answerOptions: {
    answerId: number;
    answer: string;
    colour: string;
  }[];
}

export interface PlayerGameResultsSuccessResponse {
  usersRankedByScore: {
    playerName: string;
    score: number;
  }[];
  questionResults: {
    questionId: number;
    playersCorrect: string[];
    averageAnswerTime: number;
    percentCorrect: number;
  }[];
}

export interface UsersRankedByScore {
  playerName: string;
  score: number;
}

export interface QuestionResult {
  questionId: number;
  playersCorrect: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

export type PlayerJoinReturn = PlayerJoinSuccessResponse | ErrorResponse;
export type PlayerStatusReturn = PlayerStatusSuccessResponse | ErrorResponse;
export type PlayerQuestionInfoReturn = PlayerQuestionInfoSuccessResponse | ErrorResponse;
export type PlayerGameResultsReturn = PlayerGameResultsSuccessResponse | ErrorResponse;
export type PlayerAnswerSubmitReturn = EmptyObject | ErrorResponse;

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface RegisterSuccessResponse {
  session: string;
}

export interface LoginSuccessResponse {
  token: string;
}

export interface UserDetailsSuccessResponse {
  user: {
    userId: number;
    name: string;
    email: string;
    numSuccessfulLogins: number;
    numFailedPasswordsSinceLastLogin: number;
  };
}

export interface QuizCreateSuccessResponse {
  quizId: number;
}

export interface QuizListSuccessResponse {
  quizzes: {
    quizId: number;
    name: string;
  }[];
}

export interface QuizInfoSuccessResponse {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: { questionId: number, question: string, timeLimit: number, points: number,
    answerOptions: {answerId: number, answer: string,
      correct: boolean, colour: string}[], thumbnailUrl: string} [];
  timeLimit: number;
  thumbnailUrl?: string;
}

export interface PlayerQuestionResultsSuccessResponse {
  questionId: number;
  playersCorrect: string[];
  averageAnswerTime: number;
  percentCorrect: number;
  questionCorrectBreakdown: {
    answerId: number;
    playersCorrect: string[];
  }[];
}

export type PlayerQuestionResultsReturn = PlayerQuestionResultsSuccessResponse | ErrorResponse;

export interface EmptyObject {
  [key: string] : never;
}

export interface QuestionCreateSuccessResponse {

  questionId: number

}

export interface GameStartSuccessResponse {
  gameId: number;
}

export interface gameStatusSuccessResponse {
  state: string;
  atQuestion: number;
  players: string[];
  metadata:QuizInfoReturn;

}

export type AuthRegisterReturn = RegisterSuccessResponse | ErrorResponse;
export type UserDetailsReturn = UserDetailsSuccessResponse | ErrorResponse;
export type QuizCreateReturn = QuizCreateSuccessResponse | ErrorResponse;
export type QuizListReturn = QuizListSuccessResponse | ErrorResponse;
export type QuizInfoReturn = QuizInfoSuccessResponse | ErrorResponse;
export type QuestionCreateReturn = QuestionCreateSuccessResponse | ErrorResponse;
export type GameStatusCreateReturn = gameStatusSuccessResponse | ErrorResponse;

export type NameType = 'FIRST' | 'LAST';

export enum ErrorTypes {
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  INVALID_FIRST_NAME = 'INVALID_FIRST_NAME',
  INVALID_LAST_NAME = 'INVALID_LAST_NAME',
  INVALID_QUIZ_NAME = 'INVALID_QUIZ_NAME',
  INVALID_DESCRIPTION = 'INVALID_DESCRIPTION',
  DUPLICATE_QUIZ_NAME = 'DUPLICATE_QUIZ_NAME',
  INVALID_QUIZ_ID = 'INVALID_QUIZ_ID',
  INVALID_QUESTION_ID = 'INVALID_QUESTION_ID',
  UNAUTHORISED = 'UNAUTHORISED',
  FORBIDDEN = 'FORBIDDEN',
  ACTIVE_GAME_EXISTS = 'ACTIVE_GAME_EXISTS',
  INVALID_PLAYER_ID = 'INVALID_PLAYER_ID',
  INCOMPATIBLE_GAME_STATE = 'INCOMPATIBLE_GAME_STATE',
  INVALID_POSITION = 'INVALID_POSITION',
  INVALID_ANSWER_IDS = 'INVALID_ANSWER_IDS'
}

export type GetDataFunction = () => DataStore;
export type Colour = 'red'| 'blue' | 'green' | 'yellow' | 'purple' |'pink' | 'orange';

export interface colourArray {
  colours: Colour[];
}

export const colourData: colourArray = {
  colours: ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange']
};

export type Action = 'NEXT_QUESTION' |
                        'SKIP_COUNTDOWN'
                        | 'GO_TO_ANSWER'
                        | 'GO_TO_FINAL_RESULTS'
                        | 'END';

export const actionData: Action[] = [
  'NEXT_QUESTION',
  'SKIP_COUNTDOWN',
  'GO_TO_ANSWER',
  'GO_TO_FINAL_RESULTS',
  'END'];

export const MIN_QUESTION_LENGTH = 5; export const MAX_QUESTION_LENGTH = 50;
export const MIN_POINTS = 1; export const MAX_POINTS = 10;
export const MIN_ANSWERS_LENGTH = 2; export const MAX_ANSWERS_LENGTH = 6;
export const MAX_TIMELIMIT = 180; export const MIN_TIMELIMIT = 0;
export const MAX_AUTO_START_NUM = 50;
export const MAX_ACTIVE_GAMES = 10;
export const MIN_QUESTIONS = 0;
