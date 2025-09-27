import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
  id: string;
  type: 'technical' | 'behavioral';
  question: string;
  expectedDuration: number;
}

interface InterviewSession {
  id: string;
  candidateId?: string;
  questions: Question[];
  currentQuestionIndex: number;
  startTime?: Date;
  endTime?: Date;
  isActive: boolean;
}

interface InterviewState {
  currentSession: InterviewSession | null;
  questions: Question[];
  isActive: boolean;
  progress: number;
}

const initialState: InterviewState = {
  currentSession: null,
  questions: [],
  isActive: false,
  progress: 0
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startSession: (state, action: PayloadAction<InterviewSession>) => {
      state.currentSession = action.payload;
      state.isActive = true;
      state.progress = 0;
    },
    endSession: (state) => {
      state.currentSession = null;
      state.isActive = false;
      state.progress = 0;
    },
    nextQuestion: (state) => {
      if (state.currentSession) {
        state.currentSession.currentQuestionIndex += 1;
        state.progress = (state.currentSession.currentQuestionIndex / state.currentSession.questions.length) * 100;
      }
    }
  }
});

export const { startSession, endSession, nextQuestion } = interviewSlice.actions;
export default interviewSlice.reducer;