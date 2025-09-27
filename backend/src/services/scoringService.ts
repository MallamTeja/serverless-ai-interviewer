import { Question, Answer, ScoreResult, OverallEvaluation, EvaluationResult } from '../models/candidateModel.js';
import { geminiService } from './geminiService.js';

export class ScoringService {
  private readonly scoreWeights = {
    Easy: 1.0,
    Medium: 1.5,
    Hard: 2.0
  };

  async evaluateInterview(questions: Question[], answers: Answer[]): Promise<EvaluationResult> {
    try {
      // Use Gemini service for AI evaluation
      const answerTexts = answers.map(a => a.text || '');
      const evaluation = await geminiService.evaluateAnswers(questions, answerTexts);
      
      // Apply additional scoring logic
      return this.enhanceEvaluation(evaluation, questions, answers);
    } catch (error) {
      console.error('Error evaluating interview:', error);
      // Fallback to manual scoring
      return this.performFallbackEvaluation(questions, answers);
    }
  }

  async evaluateSingleAnswer(question: Question, answer: Answer): Promise<ScoreResult> {
    try {
      const evaluation = await geminiService.evaluateAnswers([question], [answer.text || '']);
      return evaluation.scores[0];
    } catch (error) {
      console.error('Error evaluating single answer:', error);
      return this.performFallbackSingleEvaluation(question, answer);
    }
  }

  private enhanceEvaluation(
    evaluation: EvaluationResult, 
    questions: Question[], 
    answers: Answer[]
  ): EvaluationResult {
    // Apply time penalties and completeness bonuses
    const enhancedScores = evaluation.scores.map((score, index) => {
      const question = questions[index];
      const answer = answers[index];
      
      let adjustedScore = score.score;
      
      // Apply difficulty weighting
      const weight = this.scoreWeights[question.difficulty];
      adjustedScore = Math.round(adjustedScore * weight) / weight;
      
      // Time penalty for very short answers
      if (answer.text && answer.text.length < 50) {
        adjustedScore *= 0.8;
      }
      
      // Bonus for comprehensive answers
      if (answer.text && answer.text.length > 200) {
        adjustedScore *= 1.1;
      }
      
      // Cap at max score
      adjustedScore = Math.min(adjustedScore, score.maxScore);
      
      return {
        ...score,
        score: Math.round(adjustedScore)
      };
    });

    // Recalculate overall score
    const totalScore = enhancedScores.reduce((sum, s) => sum + s.score, 0);
    const maxScore = enhancedScores.reduce((sum, s) => sum + s.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    const enhancedOverall: OverallEvaluation = {
      ...evaluation.overall,
      totalScore,
      maxScore,
      percentage,
      grade: this.getGradeFromPercentage(percentage),
      recommendation: this.getRecommendationFromPercentage(percentage)
    };

    return {
      scores: enhancedScores,
      overall: enhancedOverall,
      evaluatedAt: new Date()
    };
  }

  private performFallbackEvaluation(questions: Question[], answers: Answer[]): EvaluationResult {
    const scores: ScoreResult[] = questions.map((question, index) => {
      const answer = answers[index];
      return this.performFallbackSingleEvaluation(question, answer);
    });

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const maxScore = scores.reduce((sum, s) => sum + s.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    const overall: OverallEvaluation = {
      totalScore,
      maxScore,
      percentage,
      grade: this.getGradeFromPercentage(percentage),
      summary: 'Evaluation completed using fallback scoring system. Manual review recommended.',
      strengths: this.getStrengthsFromScores(scores),
      improvements: this.getImprovementsFromScores(scores),
      recommendation: this.getRecommendationFromPercentage(percentage)
    };

    return {
      scores,
      overall,
      evaluatedAt: new Date()
    };
  }

  private performFallbackSingleEvaluation(question: Question, answer: Answer): ScoreResult {
    let score = 0;
    const maxScore = 100;
    
    if (!answer.text || answer.text.trim().length === 0) {
      return {
        questionId: question.id,
        score: 0,
        maxScore,
        feedback: 'No answer provided.',
        strengths: [],
        improvements: ['Please provide an answer to demonstrate your knowledge.']
      };
    }

    // Basic scoring based on answer length and content
    const answerLength = answer.text.length;
    const wordCount = answer.text.split(/\s+/).length;

    // Length-based scoring
    if (answerLength < 50) {
      score = 30; // Very short answer
    } else if (answerLength < 150) {
      score = 50; // Short answer
    } else if (answerLength < 300) {
      score = 70; // Medium answer
    } else {
      score = 85; // Long answer
    }

    // Adjust based on difficulty
    const difficultyMultiplier = {
      Easy: 1.0,
      Medium: 0.9,
      Hard: 0.8
    }[question.difficulty];

    score = Math.round(score * difficultyMultiplier);

    // Technical keywords bonus (basic heuristic)
    const technicalKeywords = [
      'algorithm', 'data structure', 'complexity', 'optimization',
      'design pattern', 'architecture', 'scalability', 'performance',
      'database', 'api', 'framework', 'library', 'testing'
    ];

    const keywordCount = technicalKeywords.reduce((count, keyword) => {
      return count + (answer.text.toLowerCase().includes(keyword) ? 1 : 0);
    }, 0);

    score += Math.min(keywordCount * 5, 15); // Max 15 bonus points
    score = Math.min(score, maxScore);

    return {
      questionId: question.id,
      score,
      maxScore,
      feedback: this.generateFallbackFeedback(score, answerLength, wordCount),
      strengths: this.generateStrengths(score, keywordCount),
      improvements: this.generateImprovements(score, answerLength)
    };
  }

  private generateFallbackFeedback(score: number, answerLength: number, wordCount: number): string {
    if (score >= 80) {
      return `Excellent answer! Comprehensive response with ${wordCount} words demonstrating good understanding.`;
    } else if (score >= 60) {
      return `Good answer with room for improvement. Consider providing more detailed explanations.`;
    } else if (score >= 40) {
      return `Basic answer provided. More depth and technical details would strengthen the response.`;
    } else {
      return `Answer needs significant improvement. Consider providing more comprehensive explanations with examples.`;
    }
  }

  private generateStrengths(score: number, keywordCount: number): string[] {
    const strengths: string[] = [];
    
    if (score >= 70) {
      strengths.push('Provided a comprehensive answer');
    }
    
    if (keywordCount >= 3) {
      strengths.push('Used relevant technical terminology');
    }
    
    if (score >= 60) {
      strengths.push('Demonstrated understanding of the concept');
    }
    
    return strengths.length > 0 ? strengths : ['Attempted to answer the question'];
  }

  private generateImprovements(score: number, answerLength: number): string[] {
    const improvements: string[] = [];
    
    if (score < 70) {
      improvements.push('Provide more detailed explanations');
    }
    
    if (answerLength < 100) {
      improvements.push('Include more comprehensive examples');
    }
    
    if (score < 50) {
      improvements.push('Demonstrate deeper technical understanding');
    }
    
    improvements.push('Consider real-world applications and use cases');
    
    return improvements;
  }

  private getStrengthsFromScores(scores: ScoreResult[]): string[] {
    const strengths: string[] = [];
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    
    if (avgScore >= 80) {
      strengths.push('Consistently strong performance across questions');
    } else if (avgScore >= 60) {
      strengths.push('Good overall understanding demonstrated');
    }
    
    const highScores = scores.filter(s => s.score >= 80);
    if (highScores.length > 0) {
      strengths.push(`Excellent performance on ${highScores.length} question(s)`);
    }
    
    return strengths.length > 0 ? strengths : ['Participated in the interview process'];
  }

  private getImprovementsFromScores(scores: ScoreResult[]): string[] {
    const improvements: string[] = [];
    const lowScores = scores.filter(s => s.score < 60);
    
    if (lowScores.length > 0) {
      improvements.push('Focus on strengthening fundamental concepts');
    }
    
    const unanswered = scores.filter(s => s.score === 0);
    if (unanswered.length > 0) {
      improvements.push('Ensure all questions are answered');
    }
    
    improvements.push('Practice explaining technical concepts with examples');
    improvements.push('Consider reviewing core computer science fundamentals');
    
    return improvements;
  }

  private getGradeFromPercentage(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  private getRecommendationFromPercentage(percentage: number): 'hire' | 'consider' | 'reject' {
    if (percentage >= 80) return 'hire';
    if (percentage >= 60) return 'consider';
    return 'reject';
  }

  calculateTimeBonus(timeSpent: number, timeLimit: number): number {
    if (timeSpent <= timeLimit * 0.5) {
      return 1.1; // 10% bonus for very fast completion
    } else if (timeSpent <= timeLimit * 0.8) {
      return 1.05; // 5% bonus for reasonably fast completion
    }
    return 1.0; // No bonus
  }

  calculateCompletionBonus(answeredQuestions: number, totalQuestions: number): number {
    const completionRate = answeredQuestions / totalQuestions;
    if (completionRate === 1.0) {
      return 1.1; // 10% bonus for completing all questions
    } else if (completionRate >= 0.8) {
      return 1.05; // 5% bonus for completing most questions
    }
    return completionRate; // Penalty for incomplete interviews
  }
}

export const scoringService = new ScoringService();
