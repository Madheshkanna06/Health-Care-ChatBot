import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Search, Clock, Info, Pill, Paperclip, Image, Plus, X, Copy, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import DocumentAnalysis from './DocumentAnalysis';
import VoiceInput from './VoiceInput';



interface Message {
  role: 'user' | 'assistant';
  content: string;
  category?: 'symptoms' | 'medicine' | 'remedies';
  language?: string;
  analysis?: {
    explanation?: string;
    cause?: string;
    condition?: string;
    treatment?: string[];
    medicines?: {
      name: string;
      dosage: string;
      timing: string;
      instructions: string;
    }[];
    remedies?: string[];
  };
  image?: string;
  timestamp: string;
  id: string;
}

// Language detection function
const detectLanguage = (text: string) => {
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
};


export default function ChatInterface({ onNavigate, voiceTriggerCount = 0 }: { onNavigate?: (tab: string) => void, voiceTriggerCount?: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState<'symptoms' | 'medicine' | 'remedies'>('symptoms');
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoStartVoice, setAutoStartVoice] = useState(0);
  const { t } = useTranslation();

  // Handle global voice trigger
  useEffect(() => {
    if (voiceTriggerCount > 0) {
      setAutoStartVoice(prev => prev + 1);
    }
  }, [voiceTriggerCount]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAttachmentOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript.trim()) return;

    setIsLoading(true);
    const detectedLang = detectLanguage(transcript);

    try {
      // Step 1: Get Intent from NLP
      const intentRes = await fetch("http://localhost:3001/voice-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, language: detectedLang })
      });
      const intentData = await intentRes.json();

      // Step 2: Handle Intents
      if (intentData.intent === 'NAVIGATE' && intentData.parameters?.tab && onNavigate) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: intentData.feedback || `Navigating to ${intentData.parameters.tab}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          id: Math.random().toString(36).substr(2, 9)
        }]);
        setTimeout(() => onNavigate(intentData.parameters.tab), 1000);
      }
      else if (intentData.intent === 'CREATE_REMINDER' && intentData.parameters?.medicine) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: intentData.feedback || `Creating a reminder for ${intentData.parameters.medicine}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          id: Math.random().toString(36).substr(2, 9)
        }]);
        // Switch to reminders tab
        if (onNavigate) setTimeout(() => onNavigate('reminders'), 1500);
      }
      else if (intentData.intent === 'FIND_HOSPITAL' && intentData.parameters?.location) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: intentData.feedback || `Searching for hospitals in ${intentData.parameters.location}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          id: Math.random().toString(36).substr(2, 9)
        }]);
        if (onNavigate) setTimeout(() => onNavigate('hospitals'), 1500);
      }
      else {
        // Default CHAT behavior
        setInput(transcript);
        // We'll let the user review and click send, or we could auto-submit
        // For better UX, let's auto-submit the CHAT intent
        await handleSubmit(null, transcript);
      }

    } catch (err) {
      console.error("Voice NLP error:", err);
      setInput(transcript); // Fallback to raw transcript
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent | null, overrideInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = (overrideInput || input).trim();
    if (!finalInput && !selectedImage) return;

    const userMessage = finalInput;
    const currentImage = selectedImage;
    if (!overrideInput) setInput("");
    setSelectedImage(null);

    const detectedLang = detectLanguage(userMessage);

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        category,
        language: detectedLang,
        image: currentImage || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: Math.random().toString(36).substr(2, 9)
      }
    ]);

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage,
          category,
          language: detectedLang
        })
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.raw,
          category,
          language: detectedLang,
          analysis: data.analysis,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          id: Math.random().toString(36).substr(2, 9)
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: t("tryAgain"),
          category,
          language: detectedLang,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          id: Math.random().toString(36).substr(2, 9)
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setIsAttachmentOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-280px)] bg-slate-900/80 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800 backdrop-blur-md">
      {/* Category Selector */}
      <motion.div
        className="bg-slate-950/50 backdrop-blur-md border-b border-rose-900/30 p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap gap-3 justify-center">
          {['symptoms', 'medicine', 'remedies'].map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setCategory(cat as 'symptoms' | 'medicine' | 'remedies')}
              className={`px-6 py-2.5 rounded-full transition-all duration-300 font-medium text-sm ${category === cat
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40 scale-105'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t(cat)}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-center space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-6 max-w-md mx-auto relative z-10">
                
                <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
                  {t('how Can I Help')}
                </h3>
                <p className="text-white text-lg leading-relaxed px-4">
                  {t('Enter Symptoms')}
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <p className="text-xs text-rose-400 font-medium animate-pulse">Try: "Go to reminders" or "Find a hospital"</p>
              </div>
              <DocumentAnalysis />
            </motion.div>
          )}
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-rose-950/50 flex items-center justify-center flex-shrink-0 shadow-sm border border-rose-900/30">
                  <Bot size={20} className="text-rose-400" />
                </div>
              )}
              <motion.div
                className={`max-w-[85%] p-5 shadow-sm relative group ${message.role === 'user'
                  ? 'bg-rose-500 text-white rounded-2xl rounded-tr-none shadow-lg shadow-rose-900/20'
                  : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-none border border-slate-700 shadow-black/10'
                  }`}
                whileHover={{ scale: 1.01 }}
              >
                {message.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(message.content, message.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/50 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-400"
                    title="Copy to clipboard"
                  >
                    {copiedId === message.id ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                  </button>
                )}
                <div className="space-y-4">
                  {message.image && (
                    <motion.div
                      className="rounded-xl overflow-hidden mb-3 border border-rose-900/30"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <img src={message.image} alt="Uploaded attachment" className="max-w-full h-auto object-cover" />
                    </motion.div>
                  )}
                  {message.role === 'assistant' && message.analysis ? (
                    <div className="space-y-4">
                      {message.analysis.condition && (
                        <div className="font-bold text-lg text-rose-400 border-b border-rose-900/30 pb-2">
                          {message.analysis.condition}
                        </div>
                      )}
                      {message.analysis.explanation && (
                        <div className="bg-slate-900/50 p-4 rounded-xl text-slate-300 leading-relaxed border border-slate-700/50">
                          {message.analysis.explanation}
                        </div>
                      )}
                      {message.analysis.cause && (
                        <div className="flex items-start space-x-2 text-sm bg-sky-950/30 p-3 rounded-xl text-sky-300 border border-sky-900/20">
                          <Info size={16} className="mt-0.5 flex-shrink-0 text-sky-400" />
                          <span>{message.analysis.cause}</span>
                        </div>
                      )}
                      {message.analysis.treatment && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Treatments</div>
                          {message.analysis.treatment.map((treatment, idx) => (
                            <div key={idx} className="flex items-center space-x-2 bg-green-950/20 p-2.5 rounded-xl border border-green-900/20">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                              <span className="text-sm text-slate-300">{treatment}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {message.analysis.medicines && (
                        <div className="space-y-3">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medicines</div>
                          {message.analysis.medicines.map((med, idx) => (
                            <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-rose-900/50 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="bg-purple-100 p-1.5 rounded-lg">
                                    <Pill size={16} className="text-purple-400" />
                                  </div>
                                  <span className="font-bold text-slate-200">{med.name}</span>
                                </div>
                                <a
                                  href={`https://www.drugs.com/search.php?searchterm=${encodeURIComponent(med.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-rose-400 hover:text-rose-600 transition-colors"
                                >
                                  <Search size={16} />
                                </a>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                  <span className="text-xs text-slate-500 block">Dosage</span>
                                  <span className="font-medium text-slate-300">{med.dosage}</span>
                                </div>
                                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                  <span className="text-xs text-slate-500 block">Timing</span>
                                  <div className="flex items-center space-x-1 font-medium text-slate-300">
                                    <Clock size={12} className="text-slate-500" />
                                    <span>{med.timing}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800 italic">
                                "{med.instructions}"
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {message.analysis.remedies && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Home Remedies</div>
                          {message.analysis.remedies.map((remedy, idx) => (
                            <div key={idx} className="bg-orange-950/20 p-2.5 rounded-xl text-sm text-orange-300 border-l-4 border-orange-900/50">
                              {remedy}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                  <div className={`text-[10px] mt-2 font-medium opacity-50 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.timestamp}
                  </div>
                </div>
              </motion.div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-900/40">
                  <User size={20} className="text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            className="flex items-center space-x-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-10 h-10 rounded-full bg-rose-950/50 flex items-center justify-center animate-pulse border border-rose-900/30">
              <Bot size={20} className="text-rose-400" />
            </div>
            <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl rounded-tl-none border border-rose-900/20 shadow-sm flex items-center space-x-2">
              <span className="text-sm font-medium mr-1">Thinking</span>
              <div className="flex space-x-1">
                <motion.span
                  className="w-1.5 h-1.5 bg-rose-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <motion.span
                  className="w-1.5 h-1.5 bg-rose-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                />
                <motion.span
                  className="w-1.5 h-1.5 bg-rose-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-8 p-3 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-900/40 hover:bg-rose-600 z-40"
          >
            <ChevronDown size={20} className="animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSubmit}
        className="p-4 border-t border-rose-900/30 bg-slate-900 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-full left-4 mb-2 p-2 bg-slate-800 rounded-xl shadow-xl border border-rose-900/30 flex items-center space-x-2"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-rose-50">
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
              <span className="text-xs text-slate-500 font-medium pr-2">Image attached</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center space-x-3">
          <div className="relative" ref={dropdownRef}>
            <motion.button
              type="button"
              onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
              className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg ${isAttachmentOpen ? 'bg-rose-500 text-white shadow-rose-900/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 shadow-black/20'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} className={`transition-transform duration-300 ${isAttachmentOpen ? 'rotate-45' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {isAttachmentOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full left-0 mb-4 w-48 bg-slate-800 rounded-2xl shadow-2xl border border-rose-900/30 py-2 z-50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-slate-700 transition-colors text-left"
                  >
                    <div className="bg-sky-950/50 p-2 rounded-lg">
                      <Image size={18} className="text-sky-400" />
                    </div>
                    <span className="font-medium text-slate-300 text-sm">Upload Photo</span>
                  </button>
                  <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50">
                    Coming Soon
                  </div>
                  <button
                    type="button"
                    disabled
                    className="w-full px-4 py-3 flex items-center space-x-3 opacity-50 cursor-not-allowed text-left"
                  >
                    <div className="bg-fuchsia-950/50 p-2 rounded-lg">
                      <Paperclip size={18} className="text-fuchsia-400" />
                    </div>
                    <span className="font-medium text-slate-400 text-sm">Document</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 flex space-x-3 bg-slate-950/50 p-2 rounded-2xl border border-slate-800 focus-within:ring-2 focus-within:ring-rose-900/40 focus-within:border-rose-500 transition-all duration-300 items-center">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={t(
                category === 'symptoms'
                  ? 'enterSymptoms'
                  : category === 'medicine'
                    ? 'enterCondition'
                    : 'enterRemedies'
              )}
              className="flex-1 bg-transparent text-slate-200 rounded-xl px-4 py-2 focus:outline-none placeholder-slate-500 resize-none min-h-[44px] max-h-[120px] py-2.5 custom-scrollbar"
              rows={1}
            />

            <div className="flex items-center space-x-2 pr-1">
              <VoiceInput
                onVoiceInput={handleVoiceInput}
                compact
                autoStartTrigger={autoStartVoice}
                onStateChange={setIsVoiceActive}
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              <motion.button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage) || isVoiceActive}
                className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center shadow-lg shadow-rose-900/40"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.form>
    </div >
  );
}