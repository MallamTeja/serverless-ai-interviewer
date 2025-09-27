import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Question {
  id: string;
  type: 'technical' | 'behavioral';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  expectedDuration: number;
}

export interface Answer {
  questionId: string;
  answer: string;
  timestamp: string;
  duration: number;
  confidence?: number;
}

export interface Timer {
  startTime: number;
  pausedTime: number;
  totalPausedDuration: number;
  isRunning: boolean;
}

export type SessionStatus = 'idle' | 'loading' | 'active' | 'paused' | 'completed' | 'error';

export interface InterviewSession {
  id: string;
  candidateId?: string;
  questions: Question[];
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  isActive: boolean;
}

export interface InterviewState {
  // Session management
  sessionId: string | null;
  sessionStatus: SessionStatus;
  candidateId: string | null;
  
  // Questions and progress
  questionQueue: Question[];
  currentQuestionIndex: number;
  totalQuestions: number;
  
  // Answers and responses
  answers: Answer[];
  currentAnswer: string;
  
  // Timing
  sessionTimer: Timer;
  questionTimer: Timer;
  
  // Session metadata
  startedAt: string | null;
  completedAt: string | null;
  
  // Settings
  autoAdvance: boolean;
  
  // Loading states
  isSubmitting: boolean;
  
  // Error handling
  error: string | null;
}

const createTimer = (): Timer => ({
  startTime: 0,
  pausedTime: 0,
  totalPausedDuration: 0,
  isRunning: false,
});

const initialState: InterviewState = {
  sessionId: null,
  sessionStatus: 'idle',
  candidateId: null,
  questionQueue: [],
  currentQuestionIndex: 0,
  totalQuestions: 0,
  answers: [],
  currentAnswer: '',
  sessionTimer: createTimer(),
  questionTimer: createTimer(),
  startedAt: null,
  completedAt: null,
  autoAdvance: false,
  isSubmitting: false,
  error: null,
};

// Async thunks
export const startInterview = createAsyncThunk(
  'interview/startInterview',
  async (candidateId: string) => {
    // This would normally fetch questions from the API
    const mockQuestions: Question[] = [
      {
        id: '1',
        type: 'technical',
        category: 'JavaScript',
        difficulty: 'medium',
        question: 'Explain the difference between let, const, and var in JavaScript.',
        expectedDuration: 300
      },
      {
        id: '2',
        type: 'behavioral',
        category: 'Communication',
        difficulty: 'easy',
        question: 'Tell me about a challenging project you worked on.',
        expectedDuration: 400
      }
    ];
    
    return {
      sessionId: `session-${Date.now()}`,
      candidateId,
      questions: mockQuestions
    };
  }
);

export const submitAnswer = createAsyncThunk(
  'interview/submitAnswer',
  async (answerData: { questionId: string; answer: string; duration: number }) => {
    // This would normally submit to the API
    await new Promise(resolve => setTimeout(resolve, 500));
    return answerData;
  }
);

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    // Session management
    pauseSession: (state) => {
      if (state.sessionStatus === 'active') {
        state.sessionStatus = 'paused';
        state.sessionTimer.isRunning = false;
        state.sessionTimer.pausedTime = Date.now();
        state.questionTimer.isRunning = false;
        state.questionTimer.pausedTime = Date.now();
      }
    },
    
    resumeSession: (state) => {
      if (state.sessionStatus === 'paused') {
        state.sessionStatus = 'active';
        state.sessionTimer.isRunning = true;
        state.sessionTimer.totalPausedDuration += Date.now() - state.sessionTimer.pausedTime;
        state.questionTimer.isRunning = true;
        state.questionTimer.totalPausedDuration += Date.now() - state.questionTimer.pausedTime;
      }
    },
    
    completeSession: (state) => {
      state.sessionStatus = 'completed';
      state.completedAt = new Date().toISOString();
      state.sessionTimer.isRunning = false;
      state.questionTimer.isRunning = false;
    },
    
    resetSession: (state) => {
      return initialState;
    },
    
    restoreSession: (state, action: PayloadAction<Partial<InterviewState>>) => {
      return { ...state, ...action.payload };
    },
    
    // Question management
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questionQueue = action.payload;
      state.totalQuestions = action.payload.length;
    },
    
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questionQueue.length - 1) {
        state.currentQuestionIndex += 1;
        state.currentAnswer = '';
        
        // Reset question timer
        state.questionTimer = createTimer();
        state.questionTimer.startTime = Date.now();
        state.questionTimer.isRunning = state.sessionStatus === 'active';
      } else {
        // Auto-complete session when no more questions
        state.sessionStatus = 'completed';
        state.completedAt = new Date().toISOString();
      }
    },
    
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },
    
    // Answer management
    updateCurrentAnswer: (state, action: PayloadAction<string>) => {
      state.currentAnswer = action.payload;
    },
    
    submitCurrentAnswer: (state) => {
      if (state.currentAnswer.trim()) {
        const existingAnswerIndex = state.answers.findIndex(
          (a) => a.questionId === state.questionQueue[state.currentQuestionIndex]?.id
        );
        
        const answerData: Answer = {
          questionId: state.questionQueue[state.currentQuestionIndex].id,
          answer: state.currentAnswer,
          timestamp: new Date().toISOString(),
          duration: Date.now() - state.questionTimer.startTime - state.questionTimer.totalPausedDuration
        };
        
        if (existingAnswerIndex >= 0) {
          state.answers[existingAnswerIndex] = answerData;
        } else {
          state.answers.push(answerData);
        }
        
        // Auto-advance if enabled
        if (state.autoAdvance) {
          if (state.currentQuestionIndex < state.questionQueue.length - 1) {
            state.currentQuestionIndex += 1;
            state.currentAnswer = '';
            state.questionTimer = createTimer();
            state.questionTimer.startTime = Date.now();
            state.questionTimer.isRunning = true;
          }
        }
      }
    },
    
    // Settings
    updateSettings: (state, action: PayloadAction<{ autoAdvance?: boolean }>) => {
      if (action.payload.autoAdvance !== undefined) {
        state.autoAdvance = action.payload.autoAdvance;
      }
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.sessionStatus = 'error';
    },
    
    clearError: (state) => {
      state.error = null;
      if (state.sessionStatus === 'error') {
        state.sessionStatus = 'idle';
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Start interview
      .addCase(startInterview.pending, (state) => {
        state.sessionStatus = 'loading';
        state.error = null;
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.sessionStatus = 'active';
        state.sessionId = action.payload.sessionId;
        state.candidateId = action.payload.candidateId;
        state.questionQueue = action.payload.questions;
        state.totalQuestions = action.payload.questions.length;
        state.currentQuestionIndex = 0;
        state.startedAt = new Date().toISOString();
        state.sessionTimer = createTimer();
        state.sessionTimer.startTime = Date.now();
        state.sessionTimer.isRunning = true;
        state.questionTimer = createTimer();
        state.questionTimer.startTime = Date.now();
        state.questionTimer.isRunning = true;
        state.error = null;
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.sessionStatus = 'error';
        state.error = action.error.message || 'Failed to start interview';
      })
      
      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.sessionStatus = 'completed';
        state.completedAt = new Date().toISOString();
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.error.message || 'Failed to submit answer';
      });
  },
});

export const {
  pauseSession,
  resumeSession,
  completeSession,
  resetSession,
  restoreSession,
  setQuestions,
  nextQuestion,
  previousQuestion,
  updateCurrentAnswer,
  submitCurrentAnswer,
  updateSettings,
  setError,
  clearError,
} = interviewSlice.actions;

// Selectors
export const selectCurrentQuestion = (state: { interview: InterviewState }) =>
  state.interview.questionQueue[state.interview.currentQuestionIndex] || null;

export const selectProgress = (state: { interview: InterviewState }) =>
  state.interview.totalQuestions > 0 
    ? (state.interview.currentQuestionIndex / state.interview.totalQuestions) * 100
    : 0;

export const selectTimeRemaining = (state: { interview: InterviewState }) => {
  const currentQuestion = selectCurrentQuestion(state);
  if (!currentQuestion || !state.interview.questionTimer.isRunning) return null;
  
  const elapsed = Date.now() - state.interview.questionTimer.startTime - state.interview.questionTimer.totalPausedDuration;
  const remaining = Math.max(0, currentQuestion.expectedDuration * 1000 - elapsed);
  return remaining;
};

export const selectCanGoNext = (state: { interview: InterviewState }) =>
  state.interview.currentQuestionIndex < state.interview.questionQueue.length - 1;

export const selectCanGoPrevious = (state: { interview: InterviewState }) =>
  state.interview.currentQuestionIndex > 0;

export default interviewSlice.reducer;