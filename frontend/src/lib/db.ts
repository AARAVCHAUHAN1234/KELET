import Dexie, { type Table } from 'dexie';
import type { ResearchSession } from '../types';

export class KeletDatabase extends Dexie {
  sessions!: Table<ResearchSession, string>;

  constructor() {
    super('KeletResearchDB');
    this.version(1).stores({
      sessions: 'id, question, status, created_at, updated_at'
    });
  }
}

export const db = new KeletDatabase();

export async function saveSessionToLocal(session: ResearchSession) {
  try {
    await db.sessions.put(session);
  } catch (err) {
    console.error('Failed to save session to IndexedDB:', err);
  }
}

export async function getLocalSessions(): Promise<ResearchSession[]> {
  try {
    return await db.sessions.orderBy('created_at').reverse().toArray();
  } catch (err) {
    console.error('Failed to load sessions from IndexedDB:', err);
    return [];
  }
}

export async function getLocalSession(id: string): Promise<ResearchSession | undefined> {
  try {
    return await db.sessions.get(id);
  } catch (err) {
    console.error('Failed to load session from IndexedDB:', err);
    return undefined;
  }
}

export async function deleteLocalSession(id: string) {
  try {
    await db.sessions.delete(id);
  } catch (err) {
    console.error('Failed to delete session from IndexedDB:', err);
  }
}

export async function clearLocalDatabase() {
  try {
    await db.sessions.clear();
  } catch (err) {
    console.error('Failed to clear IndexedDB:', err);
  }
}
