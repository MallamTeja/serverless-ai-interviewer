import { GoogleGenerativeAI } from '@google/generative-ai';
import { Question, EvaluationResult, ScoreResult, OverallEvaluation, GeminiPrompt, Difficulty } from '../models/candidateModel.js';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-pro' 
    });
  }

  async generateQuestions(
    jobRole: string = 'Software Developer',
    experienceLevel: string = 'Mid-level',
    techStack: string[] = ['JavaScript', 'Node.js']
  ): Promise<Question[]> {
    try {
      const prompt = this.buildQuestionPrompt(jobRole, experienceLevel, techStack);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response and create questions
      const questions = this.parseQuestionsFromResponse(text);
      return questions;
    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      // Return fallback questions if API fails
      return this.getFallbackQuestions();
    }
  }

  async evaluateAnswers(questions: Question[], answers: string[]): Promise<EvaluationResult> {
    try {
      const prompt = this.buildEvaluationPrompt(questions, answers);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the evaluation response
      const evaluation = this.parseEvaluationFromResponse(text, questions);
      return evaluation;
    } catch (error) {
      console.error('Error evaluating answers with Gemini:', error);
      // Return fallback evaluation if API fails
      return this.getFallbackEvaluation(questions, answers);
    }
  }

  private buildQuestionPrompt(jobRole: string, experienceLevel: string, techStack: string[]): string {
    return `Generate exactly 6 technical interview questions for a ${experienceLevel} ${jobRole} position.

Technical Stack: ${techStack.join(', ')}

Requirements:
- 2 Easy questions (fundamental concepts)
- 2 Medium questions (practical application)
- 2 Hard questions (advanced concepts/problem-solving)

Return the response in the following JSON format:
{
  "questions": [
    {
      "difficulty": "Easy|Medium|Hard",
      "text": "Question text here",
      "category": "Technical category"
    }
  ]
}

Focus on practical, job-relevant questions that assess real-world problem-solving abilities.`;
  }

  private buildEvaluationPrompt(questions: Question[], answers: string[]): string {
    const qapairs = questions.map((q, i) => `
Question ${i + 1} (${q.difficulty}): ${q.text}
Answer: ${answers[i] || 'No answer provided'}
`).join('\n');

    return `Evaluate the following interview answers on a scale of 0-100 for each question.

${qapairs}

Return the evaluation in the following JSON format:
{
  "scores": [
    {
      "questionId": "question_index",
      "score": 85,
      "maxScore": 100,
      "feedback": "Detailed feedback",
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    }
  ],
  "overall": {
    "totalScore": 450,
    "maxScore": 600,
    "percentage": 75,
    "grade": "B",
    "summary": "Overall performance summary",
    "strengths": ["overall_strength1", "overall_strength2"],
    "improvements": ["overall_improvement1", "overall_improvement2"],
    "recommendation": "hire|consider|reject"
  }
}

Be constructive and specific in feedback. Consider technical accuracy, depth of understanding, and practical application.`;
  }

  private parseQuestionsFromResponse(response: string): Question[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      const questions = parsed.questions || [];
      
      return questions.map((q: any, index: number) => ({
        id: `q_${Date.now()}_${index}`,
        text: q.text,
        difficulty: q.difficulty as Difficulty,
        category: q.category || 'Technical',
        timeLimit: this.getTimeLimitForDifficulty(q.difficulty)
      }));
    } catch (error) {
      console.error('Error parsing questions from Gemini response:', error);
      return this.getFallbackQuestions();
    }
  }

  private parseEvaluationFromResponse(response: string, questions: Question[]): EvaluationResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      const scores: ScoreResult[] = parsed.scores.map((s: any, index: number) => ({
        questionId: questions[index]?.id || `q_${index}`,
        score: s.score || 0,
        maxScore: s.maxScore || 100,
        feedback: s.feedback || 'No feedback provided',
        strengths: s.strengths || [],
        improvements: s.improvements || []
      }));

      const overall: OverallEvaluation = {
        totalScore: parsed.overall?.totalScore || 0,
        maxScore: parsed.overall?.maxScore || questions.length * 100,
        percentage: parsed.overall?.percentage || 0,
        grade: parsed.overall?.grade || 'F',
        summary: parsed.overall?.summary || 'No summary available',
        strengths: parsed.overall?.strengths || [],
        improvements: parsed.overall?.improvements || [],
        recommendation: parsed.overall?.recommendation || 'reject'
      };

      return {
        scores,
        overall,
        evaluatedAt: new Date()
      };
    } catch (error) {
      console.error('Error parsing evaluation from Gemini response:', error);
      return this.getFallbackEvaluation(questions, []);
    }
  }

  private getTimeLimitForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'Easy': return 300; // 5 minutes
      case 'Medium': return 600; // 10 minutes
      case 'Hard': return 900; // 15 minutes
      default: return 600;
    }
  }

  private getFallbackQuestions(): Question[] {
    return [
      {
        id: `q_${Date.now()}_0`,
        text: 'Explain the difference between var, let, and const in JavaScript.',
        difficulty: 'Easy',
        category: 'JavaScript Fundamentals',
        timeLimit: 300
      },
      {
        id: `q_${Date.now()}_1`,
        text: 'What is the event loop in JavaScript and how does it work?',
        difficulty: 'Easy',
        category: 'JavaScript Fundamentals',
        timeLimit: 300
      },
      {
        id: `q_${Date.now()}_2`,
        text: 'Implement a function to debounce API calls in JavaScript.',
        difficulty: 'Medium',
        category: 'JavaScript Programming',
        timeLimit: 600
      },
      {
        id: `q_${Date.now()}_3`,
        text: 'How would you design a RESTful API for a user management system?',
        difficulty: 'Medium',
        category: 'System Design',
        timeLimit: 600
      },
      {
        id: `q_${Date.now()}_4`,
        text: 'Explain the concept of closures in JavaScript and provide a practical use case.',
        difficulty: 'Hard',
        category: 'Advanced JavaScript',
        timeLimit: 900
      },
      {
        id: `q_${Date.now()}_5`,
        text: 'Design a scalable system for handling file uploads with progress tracking.',
        difficulty: 'Hard',
        category: 'System Architecture',
        timeLimit: 900
      }
    ];
  }

  private getFallbackEvaluation(questions: Question[], answers: string[]): EvaluationResult {
    const scores: ScoreResult[] = questions.map((q, index) => ({
      questionId: q.id,
      score: answers[index] ? 60 : 0, // Basic scoring
      maxScore: 100,
      feedback: answers[index] 
        ? 'Answer provided but requires manual review.' 
        : 'No answer provided.',
      strengths: answers[index] ? ['Attempted the question'] : [],
      improvements: ['Requires manual evaluation by interviewer']
    }));

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const maxScore = scores.length * 100;
    const percentage = Math.round((totalScore / maxScore) * 100);

    const overall: OverallEvaluation = {
      totalScore,
      maxScore,
      percentage,
      grade: this.getGradeFromPercentage(percentage),
      summary: 'Automated evaluation unavailable. Manual review required.',
      strengths: ['Participated in interview'],
      improvements: ['Manual evaluation needed'],
      recommendation: percentage >= 70 ? 'consider' : 'reject'
    };

    return {
      scores,
      overall,
      evaluatedAt: new Date()
    };
  }

  private getGradeFromPercentage(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Hello, can you respond with "Connection successful"?');
      const response = await result.response;
      const text = response.text();
      return text.toLowerCase().includes('connection successful');
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
