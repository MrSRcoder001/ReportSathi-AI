import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import api from '../../services/api';

const ChatPanel = ({ reportId }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your medical assistant. I've analyzed your report. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleVoiceInput = (event) => {
      const transcript = event.detail;
      if (transcript) {
        setInput(transcript);
        // Delay slight to allow state update, then submit form
        setTimeout(() => {
          document.getElementById('chat-submit-btn')?.click();
        }, 100);
      }
    };

    window.addEventListener('voice-input', handleVoiceInput);
    return () => window.removeEventListener('voice-input', handleVoiceInput);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post(`/reports/${reportId}/chat`, { question: userMessage });
      setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't process your question right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col shadow-md border-slate-200">
      <CardHeader className="bg-slate-50 border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
          <Bot className="h-5 w-5 text-primary" /> Ask AI About Your Report
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white border text-slate-700 rounded-bl-none shadow-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div className="bg-white border text-slate-500 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                <p className="text-sm animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask why your WBC is high..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loading}
            />
            <Button id="chat-submit-btn" type="submit" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatPanel;
