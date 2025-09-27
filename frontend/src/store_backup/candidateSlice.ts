import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Mock candidate interface for development
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'interviewed' | 'hired' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Async thunks for candidate operations
export const loadCandidatesAsync = createAsyncThunk(
  'candidates/loadCandidates',
  async () => {
    // Mock data for development
    return [] as Candidate[];
  }
);

// Candidate slice state
interface CandidateState {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  loading: boolean;
  error: string | null;
}

const initialState: CandidateState = {
  candidates: [],
  selectedCandidate: null,
  loading: false,
  error: null
};

// Candidate slice
const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    selectCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.selectedCandidate = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCandidatesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCandidatesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload;
        state.error = null;
      })
      .addCase(loadCandidatesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load candidates';
      });
  }
});

export const { selectCandidate, clearError } = candidateSlice.actions;
export default candidateSlice.reducer;
