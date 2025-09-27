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

export interface InterviewState {
  // Session management
  sessionId: string | null;
  sessionStatus: SessionStatus;
  
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
  candidateId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  
  // UI state
  isSubmitting: boolean;
  error: string | null;
  
  // Settings
  allowPause: boolean;
  autoAdvance: boolean;
  showProgress: boolean;
}

const initialTimer: Timer = {
  startTime: 0,
  pausedTime: 0,
  totalPausedDuration: 0,
  isRunning: false,
};

const initialState: InterviewState = {
  sessionId: null,
  sessionStatus: 'idle',
  questionQueue: [],
  currentQuestionIndex: 0,
  totalQuestions: 0,
  answers: [],
  currentAnswer: '',
  sessionTimer: { ...initialTimer },
  questionTimer: { ...initialTimer },
  candidateId: null,
  startedAt: null,
  completedAt: null,
  isSubmitting: false,
  error: null,
  allowPause: true,
  autoAdvance: false,
  showProgress: true,
};

// Async thunks
export const loadQuestionsAsync = createAsyncThunk(
  'interview/loadQuestions',
  async (params: { role?: string; level?: string; count?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.role) searchParams.set('role', params.role);
    if (params.level) searchParams.set('level', params.level);
    if (params.count) searchParams.set('count', params.count.toString());
    
    const response = await fetch(`/api/interview/questions?${searchParams}`);
    if (!response.ok) throw new Error('Failed to load questions');
    
    const data = await response.json();
    return data.data.questions as Question[];
  }
);

export const submitInterviewAsync = createAsyncThunk(
  'interview/submit',
  async (params: { candidateId: string; answers: Answer[]; sessionId: string }) => {
    const response = await fetch('/api/interview/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) throw new Error('Failed to submit interview');
    
    const data = await response.json();
    return data.data;
  }
);

// Helper functions
const getCurrentTimestamp = (): string => new Date().toISOString();

const startTimer = (timer: Timer): Timer => ({
  ...timer,
  startTime: Date.now(),
  isRunning: true,
});

const stopTimer = (timer: Timer): Timer => ({
  ...timer,
  isRunning: false,
});

const pauseTimer = (timer: Timer): Timer => ({
  ...timer,
  pausedTime: Date.now(),
  isRunning: false,
});

const resumeTimer = (timer: Timer): Timer => {
  const pausedDuration = timer.pausedTime > 0 ? Date.now() - timer.pausedTime : 0;
  return {
    ...timer,
    totalPausedDuration: timer.totalPausedDuration + pausedDuration,
    pausedTime: 0,
    isRunning: true,
  };
};

const calculateDuration = (timer: Timer): number => {
  if (timer.startTime === 0) return 0;
  const endTime = timer.isRunning ? Date.now() : timer.pausedTime || Date.now();
  return Math.floor((endTime - timer.startTime - timer.totalPausedDuration) / 1000);
};

// Slice
const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    // Session management
    startSession: (state, action: PayloadAction<{ candidateId?: string; sessionId?: string }>) => {
      const sessionId = action.payload.sessionId || `session_${Date.now()}`;
      const timestamp = getCurrentTimestamp();
      
      state.sessionId = sessionId;
      state.candidateId = action.payload.candidateId || null;
      state.sessionStatus = 'active';
      state.startedAt = timestamp;
      state.completedAt = null;
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.currentAnswer = '';
      state.error = null;
      
      // Start timers
      state.sessionTimer = startTimer(initialTimer);
      state.questionTimer = startTimer(initialTimer);
    },

    pauseSession: (state) => {
      if (state.sessionStatus === 'active') {
        state.sessionStatus = 'paused';
        state.sessionTimer = pauseTimer(state.sessionTimer);
        state.questionTimer = pauseTimer(state.questionTimer);
      }
    },

    resumeSession: (state) => {
      if (state.sessionStatus === 'paused') {
        state.sessionStatus = 'active';
        state.sessionTimer = resumeTimer(state.sessionTimer);
        state.questionTimer = resumeTimer(state.questionTimer);
      }
    },

    completeSession: (state) => {
      state.sessionStatus = 'completed';
      state.completedAt = getCurrentTimestamp();
      state.sessionTimer = stopTimer(state.sessionTimer);
      state.questionTimer = stopTimer(state.questionTimer);
    },

    resetSession: (state) => {
      return { ...initialState };
    },

    restoreSession: (state, action: PayloadAction<Partial<InterviewState>>) => {
      // Restore session from persisted data
      Object.assign(state, action.payload);
      
      // Ensure timers are properly restored
      if (state.sessionStatus === 'active') {
        state.sessionTimer = resumeTimer(state.sessionTimer);
        state.questionTimer = resumeTimer(state.questionTimer);
      }
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
        
        // Reset question timer for new question
        state.questionTimer = startTimer(initialTimer);
      } else if (state.currentQuestionIndex === state.questionQueue.length - 1) {
        // Last question completed
        interviewSlice.caseReducers.completeSession(state);
      }
    },

    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
        
        // Restore previous answer if exists
        const previousAnswer = state.answers.find(
          a => a.questionId === state.questionQueue[state.currentQuestionIndex].id
        );
        state.currentAnswer = previousAnswer?.answer || '';
        
        // Reset question timer
        state.questionTimer = startTimer(initialTimer);
      }
    },

    // Answer management
    updateCurrentAnswer: (state, action: PayloadAction<string>) => {
      state.currentAnswer = action.payload;
    },

    submitAnswer: (state, action: PayloadAction<{ confidence?: number }>) => {
      const currentQuestion = state.questionQueue[state.currentQuestionIndex];
      if (!currentQuestion || !state.currentAnswer.trim()) return;

      const questionDuration = calculateDuration(state.questionTimer);
      const timestamp = getCurrentTimestamp();

      const answer: Answer = {
        questionId: currentQuestion.id,
        answer: state.currentAnswer.trim(),
        timestamp,
        duration: questionDuration,
        confidence: action.payload.confidence,
      };

      // Update or add answer
      const existingIndex = state.answers.findIndex(a => a.questionId === currentQuestion.id);
      if (existingIndex >= 0) {
        state.answers[existingIndex] = answer;
      } else {
        state.answers.push(answer);
      }

      // Auto-advance if enabled
      if (state.autoAdvance) {
        interviewSlice.caseReducers.nextQuestion(state);
      }
    },

    // Settings
    updateSettings: (state, action: PayloadAction<{
      allowPause?: boolean;
      autoAdvance?: boolean;
      showProgress?: boolean;
    }>) => {
      Object.assign(state, action.payload);
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.sessionStatus = 'error';
      }
    },

    clearError: (state) => {
      state.error = null;
      if (state.sessionStatus === 'error') {
        state.sessionStatus = state.sessionId ? 'active' : 'idle';
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // Load questions
      .addCase(loadQuestionsAsync.pending, (state) => {
        state.sessionStatus = 'loading';
        state.error = null;
      })
      .addCase(loadQuestionsAsync.fulfilled, (state, action) => {
        state.questionQueue = action.payload;
        state.totalQuestions = action.payload.length;
        state.sessionStatus = 'idle';
        state.error = null;
      })
      .addCase(loadQuestionsAsync.rejected, (state, action) => {
        state.sessionStatus = 'error';
        state.error = action.error.message || 'Failed to load questions';
      })

      // Submit interview
      .addCase(submitInterviewAsync.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitInterviewAsync.fulfilled, (state) => {
        state.isSubmitting = false;
        state.sessionStatus = 'completed';
        state.completedAt = getCurrentTimestamp();
      })
      .addCase(submitInterviewAsync.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.error.message || 'Failed to submit interview';
      });
  },
});

// Actions
export const {
  startSession,
  pauseSession,
  resumeSession,
  completeSession,
  resetSession,
  restoreSession,
  setQuestions,
  nextQuestion,
  previousQuestion,
  updateCurrentAnswer,
  submitAnswer,
  updateSettings,
  setError,
  clearError,
} = interviewSlice.actions;

// Selectors
export const selectInterview = (state: { interview: InterviewState }) => state.interview;
export const selectCurrentQuestion = (state: { interview: InterviewState }) => {
  const { questionQueue, currentQuestionIndex } = state.interview;
  return questionQueue[currentQuestionIndex] || null;
};
export const selectProgress = (state: { interview: InterviewState }) => {
  const { currentQuestionIndex, totalQuestions } = state.interview;
  return {
    current: currentQuestionIndex + 1,
    total: totalQuestions,
    percentage: totalQuestions > 0 ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100) : 0,
  };
};
export const selectSessionDuration = (state: { interview: InterviewState }) => {
  return calculateDuration(state.interview.sessionTimer);
};
export const selectQuestionDuration = (state: { interview: InterviewState }) => {
  return calculateDuration(state.interview.questionTimer);
};
export const selectCanGoNext = (state: { interview: InterviewState }) => {
  const { currentQuestionIndex, questionQueue, currentAnswer } = state.interview;
  return currentQuestionIndex < questionQueue.length - 1 && currentAnswer.trim().length > 0;
};
export const selectCanGoPrevious = (state: { interview: InterviewState }) => {
  return state.interview.currentQuestionIndex > 0;
};

export default interviewSlice.reducer;
