import { Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div 
      className={`flex items-start space-x-3 ${isUser ? 'justify-end' : ''}`}
      data-testid={`message-${message.role}`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-workflow-blue rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="text-white" size={16} />
        </div>
      )}
      
      <div 
        className={`max-w-sm p-3 rounded-lg ${
          isUser 
            ? 'bg-workflow-blue text-white rounded-tr-none' 
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        }`}
        data-testid="message-content"
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {/* Show workflow steps for AI messages that mention building */}
        {!isUser && message.content.toLowerCase().includes('workflow') && (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-gray-600 flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Analyzing your requirements
            </div>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="text-gray-600" size={16} />
        </div>
      )}
    </div>
  );
}
