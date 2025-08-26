import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface InputFieldProps {
  onSendMessage: (message: string) => void;
}

export default function InputField({ onSendMessage }: InputFieldProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4" data-testid="chat-input-container">
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <Input
          type="text"
          placeholder="Describe the automation you want to build..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
          data-testid="input-chat-message"
        />
        <Button 
          type="submit"
          disabled={!message.trim()}
          className="bg-workflow-blue hover:bg-blue-700"
          data-testid="button-send-message"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
}
