// IndexedDB Persistence Layer for AI Interview Assistant
// Stores all application data locally in the browser

export interface Question {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  timeLimit?: number;
}

export interface Answer {
  questionId: string;
  text: string;
  submittedAt: Date;
  timeSpent?: number;
}

export interface ScoreResult {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface OverallEvaluation {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendation: 'hire' | 'consider' | 'reject';
}

export interface EvaluationResult {
  scores: ScoreResult[];
  overall: OverallEvaluation;
  evaluatedAt: Date;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  questions: Question[];
  answers: Answer[];
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'paused';
  currentQuestionIndex: number;
  evaluation?: EvaluationResult;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'interviewed' | 'rejected' | 'hired';
  currentSession?: InterviewSession;
  completedSessions: string[]; // Session IDs
}

class IndexedDBManager {
  private dbName = 'AIInterviewApp';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Candidates store
        if (!db.objectStoreNames.contains('candidates')) {
          const candidatesStore = db.createObjectStore('candidates', { keyPath: 'id' });
          candidatesStore.createIndex('email', 'email', { unique: true });
          candidatesStore.createIndex('status', 'status');
          candidatesStore.createIndex('createdAt', 'createdAt');
        }

        // Interview sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('candidateId', 'candidateId');
          sessionsStore.createIndex('status', 'status');
          sessionsStore.createIndex('startTime', 'startTime');
        }

        // Application state store
        if (!db.objectStoreNames.contains('appState')) {
          db.createObjectStore('appState', { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Candidate Management
  async saveCandidate(candidate: Candidate): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['candidates'], 'readwrite');
    const store = transaction.objectStore('candidates');
    
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...candidate,
        updatedAt: new Date()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save candidate'));
    });
  }

  async getCandidate(id: string): Promise<Candidate | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['candidates'], 'readonly');
    const store = transaction.objectStore('candidates');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get candidate'));
    });
  }

  async getAllCandidates(): Promise<Candidate[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['candidates'], 'readonly');
    const store = transaction.objectStore('candidates');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get candidates'));
    });
  }

  async deleteCandidate(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['candidates'], 'readwrite');
    const store = transaction.objectStore('candidates');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete candidate'));
    });
  }

  // Interview Session Management
  async saveSession(session: InterviewSession): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    
    return new Promise((resolve, reject) => {
      const request = store.put(session);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save session'));
    });
  }

  async getSession(id: string): Promise<InterviewSession | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get session'));
    });
  }

  async getSessionsByCandidate(candidateId: string): Promise<InterviewSession[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const index = store.index('candidateId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(candidateId);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get sessions'));
    });
  }

  async getCurrentSession(): Promise<InterviewSession | null> {
    const state = await this.getAppState('currentSession');
    if (!state?.value) return null;
    
    return await this.getSession(state.value);
  }

  async setCurrentSession(sessionId: string | null): Promise<void> {
    await this.setAppState('currentSession', sessionId);
  }

  // Application State Management
  async setAppState(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['appState'], 'readwrite');
    const store = transaction.objectStore('appState');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, timestamp: new Date() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to set app state'));
    });
  }

  async getAppState(key: string): Promise<{ value: any; timestamp: Date } | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['appState'], 'readonly');
    const store = transaction.objectStore('appState');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { value: result.value, timestamp: result.timestamp } : null);
      };
      request.onerror = () => reject(new Error('Failed to get app state'));
    });
  }

  // Search and Filter
  async searchCandidates(searchTerm: string, status?: string): Promise<Candidate[]> {
    const candidates = await this.getAllCandidates();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return candidates.filter(candidate => {
      const matchesSearch = !searchTerm || 
        candidate.name.toLowerCase().includes(lowerSearchTerm) ||
        candidate.email.toLowerCase().includes(lowerSearchTerm);
      
      const matchesStatus = !status || candidate.status === status;
      
      return matchesSearch && matchesStatus;
    });
  }

  // Data Export/Import for debugging
  async exportData(): Promise<{
    candidates: Candidate[];
    sessions: InterviewSession[];
    appState: any[];
  }> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['candidates', 'sessions', 'appState'], 'readonly');
    
    const [candidates, sessions, appState] = await Promise.all([
      this.getAllFromStore(transaction.objectStore('candidates')),
      this.getAllFromStore(transaction.objectStore('sessions')),
      this.getAllFromStore(transaction.objectStore('appState'))
    ]);
    
    return { candidates, sessions, appState };
  }

  private async getAllFromStore(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error('Failed to get data from store'));
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['candidates', 'sessions', 'appState'], 'readwrite');
    
    await Promise.all([
      this.clearStore(transaction.objectStore('candidates')),
      this.clearStore(transaction.objectStore('sessions')),
      this.clearStore(transaction.objectStore('appState'))
    ]);
  }

  private async clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear store'));
    });
  }
}

// Export singleton instance
export const idbManager = new IndexedDBManager();

// Helper functions for common operations
export const initializeDB = () => idbManager.init();

// Candidate helpers
export const createCandidate = (data: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt' | 'completedSessions'>) => {
  const candidate: Candidate = {
    ...data,
    id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedSessions: []
  };
  return candidate;
};

// Session helpers
export const createSession = (candidateId: string, questions: Question[] = []): InterviewSession => {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    candidateId,
    questions,
    answers: [],
    startTime: new Date(),
    status: 'pending',
    currentQuestionIndex: 0
  };
};

// Question helpers
export const createQuestion = (text: string, difficulty: 'Easy' | 'Medium' | 'Hard', category?: string): Question => {
  const timeLimits = { Easy: 20, Medium: 60, Hard: 120 }; // seconds
  
  return {
    id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    difficulty,
    category,
    timeLimit: timeLimits[difficulty]
  };
};

// Answer helpers
export const createAnswer = (questionId: string, text: string, timeSpent?: number): Answer => {
  return {
    questionId,
    text,
    submittedAt: new Date(),
    timeSpent
  };
};
