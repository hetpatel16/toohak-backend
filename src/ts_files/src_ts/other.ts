import { getData } from './dataStore';
import { EmptyObject } from './interfaces';
import { clearData } from './persistence';
import { timers } from './quiz';

/**
 * This function resets the data of the application to its initial empty state
 * @returns {{}}
 */
export function clear (): EmptyObject {
  const data = getData();

  data.users.length = 0;
  data.quizzes.length = 0;
  data.sessions.length = 0;
  data.games.length = 0;
  data.nextUserId = 1;
  data.nextQuizId = 1;
  data.nextGameId = 1;
  data.nextPlayerId = 1;

  timers.clearAll();
  // This clears the persistence data file as well
  clearData();

  return {};
}
