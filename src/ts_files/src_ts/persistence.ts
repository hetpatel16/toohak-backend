import fs from 'fs';
import { DataStore } from './interfaces';

const DATA_FILE = 'data.json';

/**
 * Saves the current data store to a JSON file
 * @param data
 */
export function saveData(data: DataStore): void {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(DATA_FILE, jsonData);
}

/**
 * Loads data from the JSON file, returns default data if file doesn't exist
 * @returns
 */
export function loadData(): DataStore {
  if (fs.existsSync(DATA_FILE)) {
    const jsonData = fs.readFileSync(DATA_FILE, 'utf8');

    const parsed = JSON.parse(jsonData);
    parsed.games ??= [];
    return parsed;
  }

  // Return default data structure if file doesn't exist
  return {
    users: [],
    quizzes: [],
    sessions: [],
    games: [],
    playerAnswers: [],
    nextUserId: 1,
    nextQuizId: 1,
    nextGameId: 1,
    nextPlayerId: 1
  };
}

/**
 * Clears the data file
 */
export function clearData(): void {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
}
