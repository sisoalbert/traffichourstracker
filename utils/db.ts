// utils/db.ts
import { openDB } from 'idb';

const DB_NAME = 'traffic-hours-db';
const STORE_NAME = 'records';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
};

export const addRecord = async (record: any) => {
  const db = await initDB();
  return db.add(STORE_NAME, record);
};

export const getAllRecords = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

// New function to delete a record
export const deleteRecord = async (id: number) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};
