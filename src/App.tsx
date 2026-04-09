import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  Send,
  Loader2,
  User,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { getChatResponse } from './services/geminiService';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export default function App() {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isSendingChat) return;

    const newUserMessage: Message = { role: 'user', parts: [{ text: inputMessage }] };
    
    // Pass the current valid history to the API
    const currentHistory = [...chatHistory];
    
    setChatHistory(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsSendingChat(true);
    setError(null);

    try {
      const response = await getChatResponse(inputMessage, currentHistory);
      const modelResponse: Message = { role: 'model', parts: [{ text: response || 'Keine Antwort erhalten.' }] };
      setChatHistory(prev => [...prev, modelResponse]);
    } catch (err: any) {
      setError(`Fehler: ${err.message || 'Unbekanntes Problem bei der Verarbeitung.'}`);
      console.error(err);
      // Remove the user message that failed so the history remains valid
      setChatHistory(currentHistory);
      // Put the text back in the input so the user doesn't lose it
      setInputMessage(inputMessage);
    } finally {
      setIsSendingChat(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-emerald-950 font-sans selection:bg-emerald-100">
    {/* Header */}
<header className="flex-none h-16 border-b border-emerald-10 bg-white/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-10">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-[#109660] rounded-xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
      {/* Das Bild direkt per Link eingebunden */}
      <img 
        src="https://i.postimg.cc/d3RCN154/Gemini-Generated-Image-kqtmfgkqtmfgkqtm-Photoroom.png" 
        alt="Schloss Montabaur Icon" 
        className="w-full h-full object-cover scale-110" 
      />
    </div>
    <div>
      <h1 className="text-xl font-bold tracking-tight text-emerald-900">MontabaurKI</h1>
    </div>
  </div>

        
        {chatHistory.length > 0 && (
          <button 
            onClick={clearChat}
            className="p-2 text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Chat leeren"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto bg-green-50/30">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <AnimatePresence mode="popLayout">
            {chatHistory.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6"
              >
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <MessageSquare size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-emerald-900">Willkommen bei MontabaurKI</h2>
                  <p className="text-emerald-600/80 max-w-sm mx-auto">
                    Ich bin dein intelligenter KI-Assistent. Wie kann ich dir heute helfen?
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-4">
                  {[
                    "Schreibe ein Gedicht über den Frühling",
                    "Erkläre Quantenphysik einfach",
                    "Gib mir Tipps für gesundes Kochen",
                    "Hilf mir beim Planen einer Reise"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInputMessage(suggestion);
                      }}
                      className="p-3 text-sm text-left bg-white border border-emerald-100 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all text-emerald-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              chatHistory.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === 'user' ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white"
                  )}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={cn(
                    "max-w-[85%] space-y-1",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-2xl shadow-sm",
                      msg.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-white text-emerald-900 rounded-tl-none border border-emerald-100"
                    )}>
                      <div className={cn(
                        "prose prose-sm max-w-none leading-relaxed",
                        msg.role === 'user' ? "prose-invert" : "prose-emerald"
                      )}>
                        <ReactMarkdown>
                          {msg.parts[0].text}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest px-1">
                      {msg.role === 'user' ? 'Du' : 'MontabaurKI'}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {isSendingChat && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-emerald-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-emerald-600" />
                <span className="text-sm text-emerald-600 animate-pulse">MontabaurKI schreibt...</span>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              {error}
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 bg-white border-t border-emerald-100">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative group">
            <textarea 
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Frage MontabaurKI etwas..."
              className="w-full pl-4 pr-14 py-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none shadow-inner"
            />
            <button 
              type="submit"
              disabled={!inputMessage.trim() || isSendingChat}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-600 text-white rounded-xl disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-200"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-[10px] text-center text-emerald-400 mt-3 uppercase tracking-widest font-medium">
            MontabaurKI kann Fehler machen. Überprüfen Sie wichtige Informationen.
          </p>
        </div>
      </footer>
    </div>
  );
}
