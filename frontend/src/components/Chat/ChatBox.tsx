import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Message from './Message';
import QuestionQueue from './QuestionQueue';
import Timer from '../UI/Timer';
import { RootState } from '@/store/store';
import { saveAnswer, moveToNextQuestion } from '@/store/interviewSlice';

const ChatBox: React.FC = () => {
  const dispatch = useDispatch();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Get relevant state from Redux store
  const { 
    currentQuestion,
    questions,
    answers,
    isInterviewComplete,
    currentQuestionIndex
  } = useSelector((state: RootState) => state.interview);
  
  // Auto scroll to bottom when new messages appear
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 100);
      }
    }
  }, [answers, currentQuestion]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim() || isSubmitting || !currentQuestion) return;
    
    try {
      setIsSubmitting(true);
      
      // Save the answer to Redux store
      await dispatch(saveAnswer({
        questionId: currentQuestion.id,
        text: answer.trim(),
        timestamp: new Date().toISOString()
      }));
      
      // Clear the input field
      setAnswer('');
      
      // Move to the next question (if available)
      dispatch(moveToNextQuestion());
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate chat messages from questions and answers
  const generateMessages = () => {
    const messages = [];
    
    // Add messages for previous questions and answers
    questions.slice(0, currentQuestionIndex).forEach((question, idx) => {
      messages.push(
        <Message 
          key={`q-${idx}`} 
          sender="AI" 
          text={question.text} 
        />
      );
      
      const correspondingAnswer = answers.find(a => a.questionId === question.id);
      if (correspondingAnswer) {
        messages.push(
          <Message 
            key={`a-${idx}`} 
            sender="Candidate" 
            text={correspondingAnswer.text} 
          />
        );
      }
    });
    
    // Add current question if available
    if (currentQuestion) {
      messages.push(
        <Message 
          key="current-question" 
          sender="AI" 
          text={currentQuestion.text} 
        />
      );
    }
    
    return messages;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Interview status header */}
      <div className="flex items-center justify-between p-4 bg-secondary/5">
        <h2 className="text-lg font-semibold">
          {isInterviewComplete 
            ? "Interview Complete" 
            : `Question ${currentQuestionIndex + 1} of ${questions.length}`
          }
        </h2>
        
        {/* Show timer for current question */}
        {currentQuestion && !isInterviewComplete && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Time remaining:</span>
            <Timer 
              duration={currentQuestion.timeLimit || 120} 
              onComplete={() => {
                // Optionally auto-submit when time expires
                // handleSubmit(new Event('submit') as any);
              }} 
            />
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Main chat area with messages */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {generateMessages()}
            </div>
          </ScrollArea>
          
          {/* Answer input form */}
          <Card className="m-4 mt-0">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    isInterviewComplete
                      ? "Interview complete"
                      : "Type your answer here..."
                  }
                  className="min-h-[100px] resize-none"
                  disabled={isSubmitting || isInterviewComplete || !currentQuestion}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={
                      !answer.trim() || 
                      isSubmitting || 
                      isInterviewComplete || 
                      !currentQuestion
                    }
                  >
                    {isSubmitting ? "Sending..." : "Send Answer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Question queue sidebar */}
        <div className="hidden md:block w-[280px] border-l bg-secondary/5">
          <QuestionQueue />
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
