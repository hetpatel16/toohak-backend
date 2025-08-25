import { DataStore } from './interfaces';
import { loadData, saveData } from './persistence';

// Load data from file on startup
const data: DataStore = loadData();

// Save data at regular intervals (every 10 seconds)
setInterval(() => {
  saveData(data);
}, 10000);

// Use getData() to access the data
export function getData(): DataStore {
  return data;
}
