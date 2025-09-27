import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import ChatBox from '../components/Chat/ChatBox';
import { Mic, MicOff, Camera, CameraOff, Clock, User } from 'lucide-react';

const Interviewee: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { 
    currentSession,
    questions,
    isActive,
    progress 
  } = useAppSelector(state => state.interview);

  const dispatch = useAppDispatch();

  const totalQuestions = 6;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isActive, timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Technical Interview</span>
              </div>
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={`font-mono text-sm ${timeRemaining < 300 ? 'text-destructive' : 'text-foreground'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleRecording}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? 'Stop' : 'Record'}
                </Button>

                <Button
                  variant={isCameraOn ? "default" : "outline"}
                  size="sm"
                  onClick={toggleCamera}
                >
                  {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                  {isCameraOn ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Interview Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-3">
            <ChatBox />
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interview Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>Answer each question thoroughly with specific examples</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>Take your time to think before responding</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>Ask for clarification if needed</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>Speak clearly and maintain good posture</p>
                </div>
              </CardContent>
            </Card>

            {/* Question Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Upcoming Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  {[
                    { type: 'Technical', topic: 'System Design' },
                    { type: 'Behavioral', topic: 'Team Leadership' },
                    { type: 'Technical', topic: 'Problem Solving' },
                    { type: 'Behavioral', topic: 'Conflict Resolution' },
                    { type: 'Technical', topic: 'Architecture' },
                  ].map((q, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${
                        index === currentQuestionIndex
                          ? 'bg-primary/10 text-primary'
                          : index < currentQuestionIndex
                          ? 'bg-muted/50 text-muted-foreground line-through'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span>{index + 1}. {q.topic}</span>
                      <Badge
                        variant={index === currentQuestionIndex ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {q.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Status</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Recording:</span>
                  <Badge variant={isRecording ? 'destructive' : 'secondary'}>
                    {isRecording ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Camera:</span>
                  <Badge variant={isCameraOn ? 'default' : 'secondary'}>
                    {isCameraOn ? 'On' : 'Off'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Time Used:</span>
                  <span className="font-mono">{formatTime((25 * 60) - timeRemaining)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interviewee;
