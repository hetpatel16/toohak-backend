import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import {
  adminAuthLogin,
  adminAuthRegister,
  adminUserDetails,
  adminUserPasswordUpdate,
  adminUserDetailsUpdate,
  adminAuthLogout
} from './ts_files/src_ts/auth';
import {
  adminQuizCreate,
  adminQuestionDelete,
  adminQuizRemove,
  adminQuizNameUpdate,
  adminQuizDescriptionUpdate,
  adminQuizThumbnail,
  adminQuizQuestionCreate,
  adminQuizQuestionUpdate,
  adminQuizList,
  adminQuizInfo,
  adminQuizGameStart,
  adminQuizGameView,
  adminQuizGameStatus,
  adminQuizGameUpdate,
  adminQuizGameResult
} from './ts_files/src_ts/quiz';
import {
  playerStatus,
  playerJoin,
  playerQuestionInfo,
  playerGameResults,
  playerAnswerSubmit,
  playerQuestionResults
} from './ts_files/src_ts/player';
import { clear } from './ts_files/src_ts/other';
import { saveData } from './ts_files/src_ts/persistence';
import { getData } from './ts_files/src_ts/dataStore';
// import { GameState } from './ts_files/src_ts/interfaces';

// Set up web app
const app = express();

// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));

// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use(
  '/docs',
  sui.serve,
  sui.setup(YAML.parse(file),
    { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }
  ));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);

  if ('error' in result && result.error === 'INVALID_ECHO') {
    return res.status(400).json(result);
  }

  return res.json(result);
});

// adminAuthRegister
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;

  try {
    const result = adminAuthRegister(email, password, nameFirst, nameLast);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e.name,
      message: e.message
    });
  }
});

// adminAuthLogin
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = adminAuthLogin(email, password);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'INVALID_CREDENTIALS') {
      res.status(400).json({
        error: 'INVALID_CREDENTIALS',
        message: e.message
      });
    }
  }
});

// adminUserDetails
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const session = req.headers.session as string;

  try {
    const result = adminUserDetails(session);
    res.status(200).json(result);
  } catch (e) {
    res.status(401).json({
      error: e.name,
      message: e.message
    });
  }
});

// adminUserDetailsUpdate
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { email, nameFirst, nameLast } = req.body;
  const session = req.headers.session as string;

  try {
    const result = adminUserDetailsUpdate(session, email, nameFirst, nameLast);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: 'UNAUTHORISED',
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminUserPasswordUpdate
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const sessionId = req.headers.session as string;
  const { oldPassword, newPassword } = req.body;

  try {
    const result = adminUserPasswordUpdate(sessionId, oldPassword, newPassword);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: 'UNAUTHORISED',
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizList
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const session = req.headers.session as string;

  try {
    const result = adminQuizList(session);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizCreate
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const { name, description } = req.body;

  try {
    const result = adminQuizCreate(session, name, description);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    }
    res.status(400).json({
      error: e.name,
      message: e.message
    });
  }
});

// adminQuizRemove - v1
app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const session = req.headers.session as string;

  // Convert quizId parametar from the request to an integer
  const quizId = parseInt(req.params.quizid as string);

  try {
    const result = adminQuizRemove(session, quizId);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizRemove - v2
app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const session = req.headers.session as string;

  // Convert quizId parametar from the request to an integer
  const quizId = parseInt(req.params.quizid as string);

  try {
    const result = adminQuizRemove(session, quizId);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizInfo
app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizId = parseInt(req.params.quizid as string);

  try {
    const result = adminQuizInfo(session, quizId);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizNameUpdate
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  // Extract session from the header
  const session = req.headers.session as string;

  // Convert quizId parametar from the request to an integer
  const quizId = parseInt(req.params.quizid as string);

  const name = req.body.name;

  try {
    const result = adminQuizNameUpdate(session, quizId, name);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizDescriptionUpdate
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  // Extract session from the header
  const session = req.headers.session as string;

  // Convert quizId parametar from the request to an integer
  const quizId = parseInt(req.params.quizid as string);

  const description = req.body.description;

  try {
    const result = adminQuizDescriptionUpdate(session, quizId, description);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizThumbnail
app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const session = req.headers.session as string;

  // Convert quizId parametar from the request to an integer
  const quizId = parseInt(req.params.quizid as string);

  const thumbnail = req.body.thumbnailUrl;

  try {
    const result = adminQuizThumbnail(session, quizId, thumbnail);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizQuestionCreate
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizId = parseInt(req.params.quizid);

  const { question, timeLimit, points, answerOptions, thumbnailUrl } = req.body.questionBody;

  try {
    const result = adminQuizQuestionCreate(quizId, session, question, timeLimit, points,
      answerOptions, thumbnailUrl);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizQuestionUpdate
app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res:Response) => {
  const quizId = parseInt(req.params.quizid as string);
  const questionId = parseInt(req.params.questionid as string);
  const session = req.headers.session as string;

  const { question, timeLimit, points, answerOptions, thumbnailUrl } = req.body.questionBody;

  try {
    const result = adminQuizQuestionUpdate(
      quizId,
      questionId,
      session,
      question,
      timeLimit,
      points,
      answerOptions,
      thumbnailUrl
    );
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuestionDeleteV1
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  try {
    const result = adminQuestionDelete(session, quizId, questionId);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    }
    if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    }

    res.status(400).json({
      error: e.name,
      message: e.message
    });
  }
});

// adminQuestionDeleteV2
app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  try {
    const result = adminQuestionDelete(session, quizId, questionId);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    } else if (e.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: e.name,
        message: e.message
      });
    } else {
      res.status(400).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// adminQuizGameStart
app.post('/v1/admin/quiz/:quizid/game/start', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizId = parseInt(req.params.quizid as string);
  const autoStartNum = req.body.autoStartNum;

  try {
    const result = adminQuizGameStart(session, quizId, autoStartNum);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: error.name,
        message: error.message
      });
    } else if (error.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: error.name,
        message: error.message
      });
    } else {
      res.status(400).json({
        error: error.name,
        message: error.message
      });
    }
  }
});

// adminQuizGameView
app.get('/v1/admin/quiz/:quizid/games', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizId = parseInt(req.params.quizid as string);

  try {
    const result = adminQuizGameView(session, quizId);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: error.name,
        message: error.message
      });

    // only 2 types of errors
    } else {
      res.status(403).json({
        error: error.name,
        message: error.message
      });
    }
  }
});

// adminQuizGameUpdate
app.put('/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizId = parseInt(req.params.quizid as string);
  const gameId = parseInt(req.params.gameid as string);
  const action = req.body.action;

  try {
    const result = adminQuizGameUpdate(session, quizId, gameId, action);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: error.name,
        message: error.message
      });
    } else if (error.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: error.name,
        message: error.message
      });
    } else {
      res.status(400).json({
        error: error.name,
        message: error.message
      });
    }
  }
});

// adminQuizGameResult
app.get('/v1/admin/quiz/:quizid/game/:gameid/results', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizid = parseInt(req.params.quizid as string);
  const gameid = parseInt(req.params.gameid as string);

  try {
    const result = adminQuizGameResult(session, quizid, gameid);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: error.name,
        message: error.message
      });
    } else if (error.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: error.name,
        message: error.message
      });
    } else {
      res.status(400).json({
        error: error.name,
        message: error.message
      });
    }
  }
});

// adminAuthLogout
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  try {
    const result = adminAuthLogout(session);
    res.status(200).json(result);
  } catch (e) {
    if (e.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: e.name,
        message: e.message
      });
    }
  }
});

// clear
app.delete('/v1/clear', (req: Request, res: Response) => {
  const result = clear();
  res.status(200).json(result);
});

// iteration 3 new features

// playerJoin
app.post('/v1/player/join', (req: Request, res: Response) => {
  const { gameId, playerName } = req.body;

  try {
    const result = playerJoin(gameId, playerName);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e.name,
      message: e.message
    });
  }
});

// playerStatus
app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid as string);

  try {
    const result = playerStatus(playerId);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e.name,
      message: e.message
    });
  }
});

// playerQuestionInfo
app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid as string);
  const questionPosition = parseInt(req.params.questionposition as string);

  try {
    const result = playerQuestionInfo(playerId, questionPosition);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e.name,
      message: e.message
    });
  }
});

// playerGameResults
app.get('/v1/player/:playerid/results', (req, res) => {
  try {
    const playerId = parseInt(req.params.playerid);

    const result = playerGameResults(playerId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error: error.name,
      message: error.message
    });
  }
});

// playerAnswerSubmit
app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  try {
    // Validate URL parameters
    const playerIdParam = req.params.playerid;
    const questionPositionParam = req.params.questionposition;

    const playerId = parseInt(playerIdParam);
    const questionPosition = parseInt(questionPositionParam);

    const { answerIds } = req.body;

    const result = playerAnswerSubmit(playerId, questionPosition, answerIds);

    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.name, message: e.message });
  }
});

// playerQuestionResult
app.get('/v1/player/:playerid/question/:questionposition/results', (
  req: Request,
  res: Response
) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  try {
    const result = playerQuestionResults(playerId, questionPosition);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e.name,
      message: e.message
    });
  }
});

// adminQuizGameStatus
app.get('/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response) => {
  const session = req.headers.session as string;
  const quizId = parseInt(req.params.quizid as string);
  const gameId = parseInt(req.params.gameid as string);

  try {
    const result = adminQuizGameStatus(session, quizId, gameId);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === 'UNAUTHORISED') {
      res.status(401).json({
        error: error.name,
        message: error.message
      });
    } else if (error.name === 'INVALID_QUIZ_ID') {
      res.status(403).json({
        error: error.name,
        message: error.message
      });
    } else {
      res.status(400).json({
        error: error.name,
        message: error.message
      });
    }
  }
});

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const message = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using 'npm start' (instead of 'npm run dev') to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;

  res.status(404).json({ error: 'ROUTE_NOT_FOUND', message });
});

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('Saving data before shutting down server');
  saveData(getData());
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
