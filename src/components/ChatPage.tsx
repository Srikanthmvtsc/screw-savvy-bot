import { useState } from "react";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm ScrewSavvy, your AI assistant for screw recommendations. Tell me about your project and I'll help you find the perfect fastener.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate bot response (in real app, this would call your LLM)
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: "I'd love to help you with that! However, I need to be connected to Supabase and configured with Llama 2 7B to provide accurate screw recommendations. Please connect the backend integration to enable full chat functionality.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);

    setInputMessage("");
    
    toast({
      title: "Backend Integration Required",
      description: "Connect to Supabase to enable AI-powered chat functionality.",
      duration: 3000,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">ScrewSavvy Chat</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card rounded-xl shadow-elegant h-full flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-gradient-industrial rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-industrial-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Describe your project or ask about screws..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-gradient-primary"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;