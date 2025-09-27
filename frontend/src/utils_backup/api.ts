// Simple mock API without encoding issues
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

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
  text: string;
  duration: number;
}

export const generateQuestions = async (): Promise<Question[]> => {
  await delay(1000);
  return [
    {
      id: '1',
      type: 'technical',
      category: 'JavaScript',
      difficulty: 'medium',
      question: 'Explain the difference between let, const, and var in JavaScript.',
      expectedDuration: 300
    }
  ];
};

export const evaluateAnswers = async (questions: Question[], answers: Answer[]) => {
  await delay(1000);
  return {
    scores: [],
    overall: {
      totalScore: 85,
      maxScore: 100,
      percentage: 85,
      grade: 'B' as const,
      summary: 'Good performance overall',
      strengths: ['Clear communication'],
      improvements: ['Add more detail'],
      recommendation: 'consider' as const
    },
    evaluatedAt: new Date()
  };
};

export const parseResume = async (file: File) => {
  await delay(500);
  return {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    success: true
  };
};

const api = {
  generateQuestions,
  evaluateAnswers,
  parseResume
};

export default api;