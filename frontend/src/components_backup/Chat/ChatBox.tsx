import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';

import { RootState } from '@/store/store';
import { addAnswer, nextQuestion, updateInterviewStatus } from '@/store/interviewSlice';
import Timer from '@/components/UI/Timer';
import ProgressBar from '@/components/UI/ProgressBar';
import Message from './Message';
import ResumeUpload from './ResumeUpload';
import MissingFieldPrompt from './MissingFieldPrompt';

export interface Question {
  id: string;
  text: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  isOptional?: boolean;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  timestamp: Date;
  timeSpent?: number;
}

interface ChatBoxProps {
  /**
   * Array of questions for the interview
   */
  questionsQueue?: Question[];
  
  /**
   * Current answer being typed
   */
  currentAnswer?: string;
  
  /**
   * Callback when answer is submitted
   */
  onAnswerSubmit?: (answer: Answer) => void;
  
  /**
   * Callback when interview is completed
   */
  onInterviewComplete?: () => void;
  
  /**
   * Whether recording is enabled
   */
  recordingEnabled?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Main chat container for the interview interface
 */
const ChatBox: React.FC<ChatBoxProps> = ({
  questionsQueue,
  currentAnswer = '',
  onAnswerSubmit,
  onInterviewComplete,
  recordingEnabled = false,
  className,
}) => {
  // Redux state
  const dispatch = useDispatch();
  const {
    questions,
    currentQuestionIndex,
    answers,
    isInterviewActive,
    isInterviewComplete,
    timeRemaining,
  } = useSelector((state: RootState) => state.interview);
  
  const { name, email, phone } = useSelector((state: RootState) => state.candidate);
  
  // Local state
  const [answerText, setAnswerText] = useState(currentAnswer);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showResumeUpload, setShowResumeUpload] = useState(!name || !email);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use provided questions or from Redux
  const interviewQuestions = questionsQueue || questions;
  const currentQuestion = interviewQuestions[currentQuestionIndex];
  const questionTimeLimit = currentQuestion?.timeLimit || 300; // Default 5 minutes
  
  // Check for missing candidate fields
  const missingFields = [];
  if (!name) missingFields.push('name');
  if (!email) missingFields.push('email');
  if (!phone) missingFields.push('phone');
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [answers, currentQuestionIndex]);
  
  // Initialize start time when interview begins
  useEffect(() => {
    if (isInterviewActive && !startTime) {
      setStartTime(new Date());
    }
  }, [isInterviewActive, startTime]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [answerText]);
  
  // Handle timer completion
  const handleTimerComplete = () => {
    if (answerText.trim()) {
      handleSubmitAnswer();
    } else {
      // Auto-submit empty answer or show warning
      handleSkipQuestion();
    }
  };
  
  // Handle answer submission
  const handleSubmitAnswer = () => {
    if (!currentQuestion || !answerText.trim()) return;
    
    const timeSpent = startTime ? (new Date().getTime() - startTime.getTime()) / 1000 : 0;
    
    const newAnswer: Answer = {
      id: `answer-${Date.now()}`,
      questionId: currentQuestion.id,
      text: answerText.trim(),
      timestamp: new Date(),
      timeSpent,
    };
    
    // Add to Redux store
    dispatch(addAnswer(newAnswer));
    
    // External callback
    if (onAnswerSubmit) {
      onAnswerSubmit(newAnswer);
    }
    
    // Clear answer and move to next question
    setAnswerText('');
    setStartTime(new Date());
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      dispatch(nextQuestion());
    } else {
      // Interview completed
      dispatch(updateInterviewStatus({ isInterviewComplete: true, isInterviewActive: false }));
      onInterviewComplete?.();
    }
  };
  
  // Handle skip question
  const handleSkipQuestion = () => {
    if (!currentQuestion) return;
    
    const timeSpent = startTime ? (new Date().getTime() - startTime.getTime()) / 1000 : 0;
    
    const skippedAnswer: Answer = {
      id: `answer-${Date.now()}`,
      questionId: currentQuestion.id,
      text: '[Skipped]',
      timestamp: new Date(),
      timeSpent,
    };
    
    dispatch(addAnswer(skippedAnswer));
    setAnswerText('');
    setStartTime(new Date());
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      dispatch(nextQuestion());
    } else {
      dispatch(updateInterviewStatus({ isInterviewComplete: true, isInterviewActive: false }));
      onInterviewComplete?.();
    }
  };
  
  // Handle recording toggle
  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    // Add actual recording logic here
  };
  
  // Handle pause/resume
  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    // Add pause logic here
  };
  
  // Handle resume upload completion
  const handleResumeUploaded = () => {
    setShowResumeUpload(false);
  };
  
  // Handle missing fields completion
  const handleFieldsComplete = () => {
    setShowResumeUpload(false);
  };
  
  // Calculate progress
  const progress = interviewQuestions.length > 0 
    ? ((currentQuestionIndex + 1) / interviewQuestions.length) * 100 
    : 0;
  
  // Show resume upload if needed
  if (showResumeUpload && (!name || !email)) {
    return (
      <div className={cn("flex items-center justify-center min-h-[400px] p-4", className)}>
        {!name || !email ? (
          <MissingFieldPrompt onAllFieldsComplete={handleFieldsComplete} />
        ) : (
          <ResumeUpload onUpload={handleResumeUploaded} />
        )}
      </div>
    );
  }
  
  // Interview completed state
  if (isInterviewComplete) {
    return (
      <Card className={cn("w-full max-w-2xl mx-auto", className)}>
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Interview Complete!</h2>
          <p className="text-muted-foreground">
            Thank you for completing the interview. Your responses have been recorded.
          </p>
          <div className="pt-4">
            <Badge variant="outline" className="text-green-600">
              {answers.length} questions answered
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No questions available
  if (!currentQuestion) {
    return (
      <Card className={cn("w-full max-w-2xl mx-auto", className)}>
        <CardContent className="p-8 text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold">No Questions Available</h2>
          <p className="text-muted-foreground">
            Please wait while we prepare your interview questions.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={cn("flex flex-col h-full max-w-4xl mx-auto", className)}>
      {/* Header with Progress */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} of {interviewQuestions.length}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {recordingEnabled && (
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleRecordingToggle}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseResume}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <ProgressBar 
            currentTime={progress} 
            totalTime={100} 
            label="Interview Progress"
            variant="timer"
            showPercentage
          />
        </CardHeader>
      </Card>
      
      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {/* Previous Q&A pairs */}
            {answers.map((answer, index) => {
              const question = interviewQuestions.find(q => q.id === answer.questionId);
              return (
                <div key={answer.id} className="space-y-2">
                  <Message 
                    sender="ai" 
                    content={question?.text || 'Question not found'}
                    timestamp={answer.timestamp}
                  />
                  <Message 
                    sender="candidate" 
                    content={answer.text}
                    timestamp={answer.timestamp}
                  />
                  {index < answers.length - 1 && <Separator className="my-4" />}
                </div>
              );
            })}
            
            {/* Current question */}
            {currentQuestion && (
              <div className="space-y-4">
                {answers.length > 0 && <Separator className="my-4" />}
                <Message 
                  sender="ai" 
                  content={currentQuestion.text}
                  timestamp={new Date()}
                />
                
                {/* Timer */}
                <div className="flex justify-center">
                  <Timer
                    duration={questionTimeLimit}
                    onTimeout={handleTimerComplete}
                    isPaused={isPaused}
                    variant="card"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Answer Input */}
        <div className="p-4 border-t">
          <div className="space-y-3">
            <Textarea
              ref={textareaRef}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here..."
              className="min-h-[100px] resize-none"
              disabled={isPaused}
            />
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {Math.floor(questionTimeLimit / 60)}:{(questionTimeLimit % 60).toString().padStart(2, '0')}
                </Badge>
                
                {currentQuestion.difficulty && (
                  <Badge 
                    variant={currentQuestion.difficulty === 'hard' ? 'destructive' : 
                            currentQuestion.difficulty === 'medium' ? 'default' : 'secondary'}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                {currentQuestion.isOptional && (
                  <Button
                    variant="outline"
                    onClick={handleSkipQuestion}
                    disabled={isPaused}
                  >
                    Skip
                  </Button>
                )}
                
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!answerText.trim() || isPaused}
                  className="min-w-[100px]"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatBox;