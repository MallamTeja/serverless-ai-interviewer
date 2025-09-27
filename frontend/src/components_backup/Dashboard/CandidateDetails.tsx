import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  FileText,
  MessageSquare,
  BarChart3,
  Star,
  Download,
  Share2,
  BookOpen,
} from 'lucide-react';

import { Candidate } from './CandidateList';

// Define message type for chat history
interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'candidate';
  timestamp: Date;
}

// Define answer type with more details
interface Answer {
  id: string;
  questionId: string;
  text: string;
  score?: number;
  feedback?: string;
  timestamp?: Date;
}

// Define question type
interface Question {
  id: string;
  text: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Extended candidate interface with chat history and question details
interface CandidateWithDetails extends Candidate {
  chatHistory?: Message[];
  answers?: Answer[];
  questions?: Question[];
}

interface CandidateDetailsProps {
  /**
   * Candidate data to display
   */
  candidate: CandidateWithDetails;
  
  /**
   * Callback when back button is clicked
   */
  onBack?: () => void;
  
  /**
   * Callback to export candidate data
   */
  onExport?: (candidateId: string) => void;
  
  /**
   * Callback to toggle favorite status
   */
  onToggleFavorite?: (candidateId: string, isFavorite: boolean) => void;
  
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Detailed view of a candidate with profile, chat history, and scores
 */
const CandidateDetails: React.FC<CandidateDetailsProps> = ({
  candidate,
  onBack,
  onExport,
  onToggleFavorite,
  className,
}) => {
  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Format date helper function
  const formatDate = (date?: Date): string => {
    if (!date) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };
  
  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Calculate average score from answers
  const calculateAverageScore = (): number | null => {
    if (!candidate.answers || candidate.answers.length === 0) {
      return null;
    }
    
    const scores = candidate.answers
      .filter(answer => answer.score !== undefined)
      .map(answer => answer.score!);
    
    if (scores.length === 0) return null;
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };
  
  // Get status badge
  const getStatusBadge = () => {
    switch (candidate.status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 gap-1">
            <AlertTriangle className="h-3 w-3" /> Failed
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
    }
  };
  
  // Get score color based on value
  const getScoreColor = (score?: number): string => {
    if (score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Get score background color based on value
  const getScoreBackground = (score?: number): string => {
    if (score === undefined) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-amber-100';
    return 'bg-red-100';
  };
  
  // Get question text by ID
  const getQuestionText = (questionId: string): string => {
    if (!candidate.questions) return 'Unknown Question';
    
    const question = candidate.questions.find(q => q.id === questionId);
    return question ? question.text : 'Unknown Question';
  };
  
  // Render profile section
  const renderProfile = () => (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Candidate Profile</CardTitle>
        <CardDescription>
          Basic information about the candidate
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold">{candidate.name}</h2>
            <p className="text-muted-foreground">{candidate.position || 'No position specified'}</p>
            <div className="flex items-center justify-center sm:justify-start pt-1">
              {getStatusBadge()}
            </div>
          </div>
          
          {candidate.score !== undefined && (
            <div className="ml-auto flex flex-col items-center">
              <div className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold",
                getScoreBackground(candidate.score)
              )}>
                <span className={getScoreColor(candidate.score)}>{candidate.score}</span>
              </div>
              <span className="text-xs mt-1 text-muted-foreground">Overall Score</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Email:</span>
              <span className="text-sm font-medium">{candidate.email}</span>
            </div>
            
            {candidate.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Phone:</span>
                <span className="text-sm font-medium">{candidate.phone}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {candidate.interviewDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Interview Date:</span>
                <span className="text-sm font-medium">{formatDate(candidate.interviewDate)}</span>
              </div>
            )}
            
            {candidate.position && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Position:</span>
                <span className="text-sm font-medium">{candidate.position}</span>
              </div>
            )}
          </div>
        </div>
        
        {candidate.notes && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Notes</span>
              </div>
              <p className="text-sm text-muted-foreground">{candidate.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
  
  // Render chat history section
  const renderChatHistory = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Interview Conversation</CardTitle>
        <CardDescription>
          Complete chat history between AI and candidate
        </CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {candidate.chatHistory && candidate.chatHistory.length > 0 ? (
            candidate.chatHistory.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-max max-w-[80%] rounded-lg p-3",
                  message.sender === 'ai'
                    ? "bg-primary/10 ml-auto"
                    : "bg-muted"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={cn(
                        "text-xs",
                        message.sender === 'ai' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted-foreground/20"
                      )}>
                        {message.sender === 'ai' ? 'AI' : getInitials(candidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">
                      {message.sender === 'ai' ? 'Interviewer' : candidate.name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No chat history available for this interview.
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
  
  // Render answers and scores section
  const renderAnswers = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Question Responses & Scores</CardTitle>
        <CardDescription>
          Evaluation of each response with scoring
        </CardDescription>
      </CardHeader>
      
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Question</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="hidden md:table-cell">Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidate.answers && candidate.answers.length > 0 ? (
              candidate.answers.map((answer) => (
                <TableRow key={answer.id}>
                  <TableCell className="align-top font-medium">
                    <div className="font-medium text-sm">
                      {getQuestionText(answer.questionId)}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong className="block text-xs uppercase text-muted-foreground mb-1">Response:</strong>
                      {answer.text.length > 100
                        ? `${answer.text.substring(0, 100)}...`
                        : answer.text}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {answer.score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          getScoreBackground(answer.score)
                        )}>
                          <span className={cn("font-medium", getScoreColor(answer.score))}>
                            {answer.score}
                          </span>
                        </div>
                        <div className="w-24 hidden sm:block">
                          <Progress value={answer.score} className="h-2" />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not scored</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top hidden md:table-cell">
                    {answer.feedback ? (
                      <p className="text-sm text-muted-foreground">{answer.feedback}</p>
                    ) : (
                      <span className="text-xs text-muted-foreground">No feedback provided</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                  No answers recorded for this interview.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {calculateAverageScore() !== null && (
        <CardFooter className="border-t p-4 flex justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Average Score:</span>
          </div>
          <div className={cn(
            "font-bold text-lg",
            getScoreColor(calculateAverageScore() ?? undefined)
          )}>
            {calculateAverageScore()}/100
          </div>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back to List
            </Button>
          )}
          <h1 className="text-xl font-bold">Candidate Details</h1>
        </div>
        
        <div className="flex gap-2">
          {onToggleFavorite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleFavorite(candidate.id, !candidate.isFavorite)}
              className={cn(
                candidate.isFavorite && "border-amber-200 bg-amber-50 hover:bg-amber-100"
              )}
            >
              <Star
                className={cn(
                  "h-4 w-4 mr-1",
                  candidate.isFavorite ? "fill-amber-400 text-amber-400" : ""
                )}
              />
              {candidate.isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
          )}
          
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(candidate.id)}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
          
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Responses
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          {renderProfile()}
        </TabsContent>
        
        <TabsContent value="conversation" className="mt-4 h-[calc(100vh-240px)]">
          {renderChatHistory()}
        </TabsContent>
        
        <TabsContent value="responses" className="mt-4">
          {renderAnswers()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CandidateDetails;
