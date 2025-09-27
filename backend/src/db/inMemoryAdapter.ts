// Simple in-memory storage for testing
import { Candidate, InterviewSession, Question, Answer, EvaluationResult, PaginationParams, PaginatedResponse } from '../models/candidateModel.js';

export class InMemoryAdapter {
  private candidates: Map<string, Candidate> = new Map();
  private interviews: Map<string, InterviewSession> = new Map();
  private questions: Map<string, Question> = new Map();
  private answers: Map<string, Answer & { sessionId: string }> = new Map();
  private evaluations: Map<string, EvaluationResult> = new Map();

  async initialize(): Promise<void> {
    console.log('In-memory adapter initialized');
  }

  // Candidate operations
  async saveCandidate(candidate: Candidate): Promise<Candidate> {
    this.candidates.set(candidate.id, candidate);
    return candidate;
  }

  async getCandidate(id: string): Promise<Candidate | null> {
    return this.candidates.get(id) || null;
  }

  async getCandidates(params: PaginationParams = { page: 1, limit: 10 }): Promise<PaginatedResponse<Candidate>> {
    let candidates = Array.from(this.candidates.values());
    
    // Apply search filter
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      candidates = candidates.filter(candidate => 
        candidate.name.toLowerCase().includes(searchTerm) ||
        candidate.email.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (params.sortBy) {
      candidates.sort((a, b) => {
        const aValue = (a as any)[params.sortBy!];
        const bValue = (b as any)[params.sortBy!];
        const direction = params.sortOrder === 'desc' ? -1 : 1;
        
        if (aValue < bValue) return -1 * direction;
        if (aValue > bValue) return 1 * direction;
        return 0;
      });
    }

    const total = candidates.length;
    const totalPages = Math.ceil(total / params.limit);
    const startIndex = (params.page - 1) * params.limit;
    const endIndex = startIndex + params.limit;
    const paginatedCandidates = candidates.slice(startIndex, endIndex);

    return {
      data: paginatedCandidates,
      total,
      page: params.page,
      limit: params.limit,
      totalPages
    };
  }

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<Candidate | null> {
    const candidate = this.candidates.get(id);
    if (!candidate) {
      return null;
    }

    const updatedCandidate = {
      ...candidate,
      ...updates,
      updatedAt: new Date()
    };

    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }

  async deleteCandidate(id: string): Promise<boolean> {
    return this.candidates.delete(id);
  }

  // Interview session operations
  async saveInterviewSession(session: InterviewSession): Promise<InterviewSession> {
    this.interviews.set(session.id, session);
    return session;
  }

  async getInterviewSession(id: string): Promise<InterviewSession | null> {
    return this.interviews.get(id) || null;
  }

  async getInterviewSessionsByCandidateId(candidateId: string): Promise<InterviewSession[]> {
    return Array.from(this.interviews.values()).filter(session => session.candidateId === candidateId);
  }

  // Question operations
  async saveQuestions(questions: Question[]): Promise<void> {
    questions.forEach(question => {
      this.questions.set(question.id, question);
    });
  }

  async getQuestions(sessionId: string): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  // Answer operations
  async saveAnswer(answer: Answer & { sessionId: string }): Promise<void> {
    const id = `${answer.sessionId}_${answer.questionId}`;
    this.answers.set(id, answer);
  }

  async getAnswersBySessionId(sessionId: string): Promise<Answer[]> {
    return Array.from(this.answers.values()).filter(answer => answer.sessionId === sessionId);
  }

  // Evaluation operations
  async saveEvaluation(sessionId: string, evaluation: EvaluationResult): Promise<void> {
    this.evaluations.set(sessionId, evaluation);
  }

  async getEvaluation(sessionId: string): Promise<EvaluationResult | null> {
    return this.evaluations.get(sessionId) || null;
  }

  async clearAllData(): Promise<void> {
    this.candidates.clear();
    this.interviews.clear();
    this.questions.clear();
    this.answers.clear();
    this.evaluations.clear();
  }
}

export const inMemoryAdapter = new InMemoryAdapter();