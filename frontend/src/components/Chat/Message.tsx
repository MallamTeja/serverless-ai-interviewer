import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Bot, User, Clock, CheckCircle2 } from 'lucide-react';

export type MessageSender = 'ai' | 'candidate';

interface MessageProps {
  /**
   * Message sender type
   */
  sender: MessageSender;
  
  /**
   * Message content
   */
  content: string;
  
  /**
   * Message timestamp
   */
  timestamp?: Date;
  
  /**
   * Whether message is being typed (for loading states)
   */
  isTyping?: boolean;
  
  /**
   * Whether message has been read/acknowledged
   */
  isRead?: boolean;
  
  /**
   * Optional metadata for the message
   */
  metadata?: {
    questionType?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    timeSpent?: number;
  };
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Component to display a single chat message (candidate or AI)
 */
const Message: React.FC<MessageProps> = ({
  sender,
  content,
  timestamp,
  isTyping = false,
  isRead = false,
  metadata,
  className,
}) => {
  // Format timestamp
  const formatTime = (date?: Date): string => {
    if (!date) return '';
    
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };
  
  // Format time spent
  const formatTimeSpent = (seconds?: number): string => {
    if (!seconds) return '';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };
  
  // Determine message alignment and styling
  const isAI = sender === 'ai';
  const messageAlignment = isAI ? 'flex-row' : 'flex-row-reverse';
  const cardAlignment = isAI ? 'mr-auto' : 'ml-auto';
  const cardVariant = isAI ? 'default' : 'secondary';
  
  // Get avatar components
  const getAvatarContent = () => {
    if (isAI) {
      return (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      );
    }
    
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-secondary">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  };
  
  // Get difficulty badge color
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  // Render typing indicator
  if (isTyping) {
    return (
      <div className={cn("flex items-start gap-3 max-w-3xl", messageAlignment, className)}>
        {getAvatarContent()}
        
        <Card className={cn("min-w-[80px] max-w-xs", cardAlignment)}>
          <CardContent className="p-3">
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {isAI ? 'AI is typing...' : 'Candidate is typing...'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-start gap-3 max-w-3xl", messageAlignment, className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {getAvatarContent()}
      </div>
      
      {/* Message Content */}
      <div className={cn("flex-1 max-w-[70%] space-y-1", cardAlignment)}>
        {/* Message Card */}
        <Card className={cn(
          "relative",
          isAI ? "bg-card border" : "bg-primary text-primary-foreground border-primary"
        )}>
          <CardContent className="p-3">
            {/* Metadata badges (for AI messages) */}
            {isAI && metadata && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {metadata.questionType && (
                  <Badge variant="outline" className="text-xs">
                    {metadata.questionType}
                  </Badge>
                )}
                
                {metadata.difficulty && (
                  <Badge variant="outline" className={cn("text-xs", getDifficultyColor(metadata.difficulty))}>
                    {metadata.difficulty}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Message text */}
            <div className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap break-words",
              isAI ? "text-foreground" : "text-primary-foreground"
            )}>
              {content}
            </div>
          </CardContent>
        </Card>
        
        {/* Message footer */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground px-1",
          isAI ? "justify-start" : "justify-end"
        )}>
          {/* Timestamp */}
          {timestamp && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(timestamp)}
            </div>
          )}
          
          {/* Time spent (for candidate messages) */}
          {!isAI && metadata?.timeSpent && (
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              {formatTimeSpent(metadata.timeSpent)}
            </div>
          )}
          
          {/* Read indicator */}
          {!isAI && isRead && (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;