export interface Question {
  id: string;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  timeLimit?: number; // in seconds
}

export interface Answer {
  questionId: string;
  text: string;
  submittedAt: Date;
  score?: number;
  feedback?: string;
}

export interface QuestionWithAnswer {
  question: Question;
  answer: Answer;
  score: number;
  feedback: string;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  questions: Question[];
  answers: Answer[];
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'abandoned';
  overallScore?: number;
  summary?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile?: string;
  createdAt: Date;
  updatedAt: Date;
  interviews: InterviewSession[];
  finalScore?: number;
  summary?: string;
  status: 'pending' | 'interviewed' | 'rejected' | 'hired';
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

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  experience?: string;
  education?: string;
  skills?: string[];
  rawText?: string;
}

export interface FileUploadResult {
  success: boolean;
  data?: ResumeData;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
}

export interface GeminiPrompt {
  text: string;
  context?: string;
  config?: GeminiGenerationConfig;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type InterviewStatus = 'pending' | 'in-progress' | 'completed' | 'abandoned';
export type CandidateStatus = 'pending' | 'interviewed' | 'rejected' | 'hired';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type Recommendation = 'hire' | 'consider' | 'reject';