import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

// Types
interface Question {
  id: string;
  type: 'technical' | 'behavioral';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  expectedDuration: number;
}

interface Answer {
  questionId: string;
  answer: string;
  duration?: number;
  confidence?: number;
}

interface SubmitRequest {
  candidateId?: string;
  sessionId?: string;
  answers: Answer[];
}

interface QuestionScore {
  questionId: string;
  score: number;
  maxScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
  };
}

interface SubmitResponse {
  sessionId: string;
  candidateId: string;
  overallScore: number;
  maxScore: number;
  questionScores: QuestionScore[];
  summary: {
    totalQuestions: number;
    answeredQuestions: number;
    averageScore: number;
    totalDuration: number;
    strengths: string[];
    improvements: string[];
    recommendation: string;
  };
  completedAt: string;
}

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /questions - Return mock question queue
router.get('/questions', asyncHandler(async (req: Request, res: Response) => {
  const { role, level, count = 6 } = req.query;

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      type: 'technical',
      category: 'programming',
      difficulty: 'medium',
      question: 'Explain the difference between synchronous and asynchronous programming. Provide examples of when you would use each approach.',
      expectedDuration: 4,
    },
    {
      id: 'q2',
      type: 'behavioral',
      category: 'teamwork',
      difficulty: 'easy',
      question: 'Describe a challenging project you worked on as part of a team. What was your role and how did you contribute to its success?',
      expectedDuration: 5,
    },
    {
      id: 'q3',
      type: 'technical',
      category: 'problem-solving',
      difficulty: 'hard',
      question: 'How would you design a scalable system to handle 1 million concurrent users? Walk me through your architecture decisions.',
      expectedDuration: 8,
    },
    {
      id: 'q4',
      type: 'technical',
      category: 'algorithms',
      difficulty: 'medium',
      question: 'Implement a function to find the longest palindromic substring in a given string. Explain your approach and time complexity.',
      expectedDuration: 10,
    },
    {
      id: 'q5',
      type: 'behavioral',
      category: 'leadership',
      difficulty: 'medium',
      question: 'Tell me about a time when you had to make a difficult decision under pressure. How did you approach it and what was the outcome?',
      expectedDuration: 6,
    },
    {
      id: 'q6',
      type: 'technical',
      category: 'debugging',
      difficulty: 'medium',
      question: 'Describe your process for debugging a complex issue in production. What tools and strategies do you use?',
      expectedDuration: 7,
    },
  ];

  const selectedQuestions = mockQuestions.slice(0, Number(count));
  const totalDuration = selectedQuestions.reduce((sum, q) => sum + q.expectedDuration, 0);

  res.status(200).json({
    success: true,
    data: {
      questions: selectedQuestions,
      metadata: {
        role: role || 'software-engineer',
        level: level || 'mid',
        totalQuestions: selectedQuestions.length,
        estimatedDuration: totalDuration,
        generatedAt: new Date().toISOString(),
      },
    },
  });
}));

// POST /submit - Accept answers and return scores
router.post('/submit', asyncHandler(async (req: Request, res: Response) => {
  const { candidateId, sessionId, answers }: SubmitRequest = req.body;

  // Validation
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Answers array is required and cannot be empty',
      error: {
        code: 'INVALID_ANSWERS',
        details: 'Expected array of answer objects with questionId and answer fields',
      },
    });
  }

  // Validate each answer
  for (const answer of answers) {
    if (!answer.questionId || !answer.answer) {
      return res.status(400).json({
        success: false,
        message: 'Each answer must have questionId and answer fields',
        error: {
          code: 'MISSING_ANSWER_FIELDS',
          details: 'Required fields: questionId, answer',
        },
      });
    }
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate mock scores for each question
  const questionScores: QuestionScore[] = answers.map((answer) => {
    const baseScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const maxScore = 100;
    
    return {
      questionId: answer.questionId,
      score: baseScore,
      maxScore,
      feedback: {
        strengths: [
          'Clear communication',
          'Good technical understanding',
          'Logical approach to problem-solving',
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        improvements: [
          'Could provide more specific examples',
          'Consider discussing edge cases',
          'Expand on implementation details',
        ].slice(0, Math.floor(Math.random() * 2) + 1),
      },
    };
  });

  // Calculate overall metrics
  const overallScore = Math.round(
    questionScores.reduce((sum, q) => sum + q.score, 0) / questionScores.length
  );
  const totalDuration = answers.reduce((sum, a) => sum + (a.duration || 0), 0);
  const maxScore = 100;

  // Generate summary
  const allStrengths = questionScores.flatMap(q => q.feedback.strengths);
  const allImprovements = questionScores.flatMap(q => q.feedback.improvements);
  
  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 3);
  const uniqueImprovements = [...new Set(allImprovements)].slice(0, 2);

  const getRecommendation = (score: number): string => {
    if (score >= 90) return 'Excellent candidate - strongly recommend for hire';
    if (score >= 80) return 'Strong candidate - recommend for hire';
    if (score >= 70) return 'Good candidate - consider for hire with additional assessment';
    if (score >= 60) return 'Fair candidate - may need additional training';
    return 'Candidate needs significant improvement';
  };

  const response: SubmitResponse = {
    sessionId: sessionId || `session_${Date.now()}`,
    candidateId: candidateId || `candidate_${Date.now()}`,
    overallScore,
    maxScore,
    questionScores,
    summary: {
      totalQuestions: questionScores.length,
      answeredQuestions: answers.length,
      averageScore: overallScore,
      totalDuration,
      strengths: uniqueStrengths,
      improvements: uniqueImprovements,
      recommendation: getRecommendation(overallScore),
    },
    completedAt: new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    data: response,
  });
}));

// Error handler for this router
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Interview route error:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error in interview service',
    error: {
      code: err.code || 'INTERVIEW_ERROR',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
