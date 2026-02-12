
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Library, BookOpen } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import * as StorageService from '../services/storageService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu Asistente experto del Campus. Tengo acceso a todos los manuales de la tienda (Caja, PDA, Visual, KPIs, etc.). ¿En qué puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const manuals = StorageService.getManuals();
      const files = manuals
        .filter(m => m.fileData)
        .map(m => ({ data: m.fileData!, mimeType: m.mimeType || 'text/plain' }));

      const response = await GeminiService.askManualChatbot(input, files);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "Lo siento, ha habido un problema al consultar la base de datos de manuales. Por favor, inténtalo de nuevo.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center h-16 w-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110
          ${isOpen ? 'bg-zinc-800 rotate-90' : 'bg-black'}
        `}
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-85 sm:w-96 h-[550px] bg-white rounded-4xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="p-5 bg-black text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-800 p-2.5 rounded-2xl">
                <Bot className="h-5 w-5 text-brand-400" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest">Asistente Campus</h3>
                <div className="flex items-center gap-1.5">
                   <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                   <p className="text-[9px] text-zinc-400 font-bold uppercase">Base de Conocimiento Activa</p>
                </div>
              </div>
            </div>
            <Library className="h-5 w-5 text-zinc-700" />
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F9FAFB]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`
                    flex-shrink-0 h-9 w-9 rounded-2xl flex items-center justify-center shadow-sm
                    ${msg.sender === 'user' ? 'bg-white' : 'bg-black'}
                  `}>
                    {msg.sender === 'user' ? <User className="h-4 w-4 text-zinc-600" /> : <Bot className="h-4 w-4 text-white" />}
                  </div>
                  <div className={`
                    p-4 rounded-3xl text-sm leading-relaxed shadow-sm
                    ${msg.sender === 'user' 
                      ? 'bg-zinc-800 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
                  `}>
                    {msg.text}
                    <div className={`text-[9px] mt-2 font-bold uppercase opacity-40 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-center bg-white px-5 py-4 rounded-3xl shadow-sm border border-gray-100 rounded-tl-none">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">Consultando manuales</span>
                    <span className="text-[9px] text-gray-400">Analizando biblioteca técnica...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre cierres, PDA, KPIs..."
                className="w-full text-sm bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:border-black focus:bg-white transition-all placeholder:text-gray-400 font-medium"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 h-10 w-10 bg-black text-white rounded-xl disabled:opacity-20 hover:bg-zinc-800 transition-all flex items-center justify-center active:scale-90"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                <BookOpen className="h-2.5 w-2.5" /> IA Generativa
              </div>
              <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                <Library className="h-2.5 w-2.5" /> Fuente: Manuales Maspo
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
