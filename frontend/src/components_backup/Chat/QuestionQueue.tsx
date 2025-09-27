import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Timer from "../UI/Timer";
import ChatBox from "./ChatBox";

export interface Question {
  id: string;
  text: string;
  type: "easy" | "medium" | "hard";
}

interface QuestionQueueProps {
  questions: Question[];
  onAnswerSubmit: (questionId: string, answer: string) => void;
}

const getDuration = (type: "easy" | "medium" | "hard") => {
  switch (type) {
    case "easy":
      return 20;
    case "medium":
      return 60;
    case "hard":
      return 120;
    default:
      return 30;
  }
};

const QuestionQueue: React.FC<QuestionQueueProps> = ({ questions, onAnswerSubmit }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [answer, setAnswer] = useState("");
  const currentQuestion = questions[currentIdx];

  useEffect(() => {
    setAnswer("");
    setIsTimerRunning(true);
  }, [currentIdx]);

  const handleTimeout = useCallback(() => {
    onAnswerSubmit(currentQuestion.id, answer);
    setIsTimerRunning(false);
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((idx) => idx + 1);
      }
    }, 500);
  }, [currentIdx, currentQuestion, answer, onAnswerSubmit, questions.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswerSubmit(currentQuestion.id, answer);
    setIsTimerRunning(false);
    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((idx) => idx + 1);
      }
    }, 500);
  };

  if (!currentQuestion) {
    return (
      <Card className="p-6 text-center shadow-md rounded-lg max-w-md mx-auto mt-8">
        <div className="text-lg font-semibold mb-2">All questions completed!</div>
        <div className="text-muted-foreground">Thank you for participating.</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 shadow-md rounded-lg max-w-md mx-auto w-full mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-base font-medium mb-1">Question {currentIdx + 1} of {questions.length}</div>
        <div className="text-lg font-semibold mb-2">{currentQuestion.text}</div>
      </div>
      <Timer
        duration={getDuration(currentQuestion.type)}
        onTimeout={handleTimeout}
        isRunning={isTimerRunning}
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
        <textarea
          className="border rounded-md p-2 resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-primary"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          disabled={!isTimerRunning}
          required
        />
        <Button type="submit" disabled={!isTimerRunning || !answer.trim()} className="w-full">
          Submit Answer
        </Button>
      </form>
      <div className="mt-2">
        <ChatBox
          question={currentQuestion}
          answer={answer}
          isPreview
        />
      </div>
    </Card>
  );
};

export default QuestionQueue;