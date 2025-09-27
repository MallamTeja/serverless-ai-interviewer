import React, { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface TimerProps {
  duration: number; // seconds
  onTimeout: () => void;
  isRunning: boolean;
}

const Timer: React.FC<TimerProps> = ({ duration, onTimeout, isRunning }) => {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSecondsLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, onTimeout]);

  const percent = Math.round((secondsLeft / duration) * 100);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="text-sm text-muted-foreground">Time left: {secondsLeft}s</div>
      <Progress value={percent} className="h-2 w-full transition-all duration-300" />
    </div>
  );
};

export default Timer;