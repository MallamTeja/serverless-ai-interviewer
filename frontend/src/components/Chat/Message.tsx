import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MessageProps {
  /**
   * Who sent this message
   */
  sender: 'AI' | 'Candidate';
  
  /**
   * The content of the message
   */
  text: string;
  
  /**
   * Optional class name for additional styling
   */
  className?: string;
}

/**
 * Message component for displaying chat messages in the interview
 */
export const Message: React.FC<MessageProps> = ({ sender, text, className }) => {
  return (
    <Card 
      className={cn(
        'mb-4 max-w-[85%] shadow-sm',
        sender === 'AI' 
          ? 'bg-primary/10 mr-auto' 
          : 'bg-secondary/10 ml-auto',
        className
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col">
          <span className={cn(
            'text-xs font-semibold mb-1',
            sender === 'AI' ? 'text-primary' : 'text-secondary'
          )}>
            {sender}
          </span>
          <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
            {text}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Message;
